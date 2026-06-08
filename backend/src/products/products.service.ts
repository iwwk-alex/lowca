import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(@InjectModel(Product.name) private productModel: Model<ProductDocument>) {}

  async findAll(store?: string, limit = 100, skip = 0): Promise<Product[]> {
    const filter = store ? { store: store.toLowerCase() } : {};
    return this.productModel.find(filter).skip(skip).limit(limit).sort({ name: 1 }).exec();
  }

  async search(query: string): Promise<Product[]> {
    if (!query || !query.trim()) return [];
    const regex = new RegExp(query.trim(), 'i');
    
    // 1. Search in local MongoDB database first
    let dbResults = await this.productModel
      .find({ $or: [{ name: regex }, { category: regex }] })
      .limit(50)
      .exec();

    // 2. If we have fewer than 3 database results, scrape Blix.pl on-demand!
    if (dbResults.length < 3) {
      this.logger.log(`Fewer than 3 results in database for "${query}". Scraping Blix.pl on-demand...`);
      const scraped = await this.scrapeBlixSearch(query);
      if (scraped.length > 0) {
        // Save fresh results to the DB
        await this.bulkUpsert(scraped);
        
        // Re-query the database to return full Mongoose documents
        dbResults = await this.productModel
          .find({ $or: [{ name: regex }, { category: regex }] })
          .limit(50)
          .exec();
      }
    }

    if (dbResults.length > 0) {
      return dbResults;
    }

    // 3. Fallback: If still no results, query Gemini API for AI-based price estimates
    if (process.env.GEMINI_API_KEY) {
      this.logger.log(`No database or scraped results for "${query}". Fetching real-time AI price estimates...`);
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const prompt = `You are a Polish grocery price comparison assistant. Estimate the current regular prices for the product "${query}" in Poland at Biedronka, Lidl, and Kaufland. Return exactly 3 objects, one per store. JSON schema: [{"name": "Short product name in Polish", "store": "biedronka"|"lidl"|"kaufland", "price": number, "originalPrice": number, "imgUrl": "", "category": "Inne"}]`;

        const payload = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        };

        const response = await axios.post(url, payload, { timeout: 20000 });
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (text) {
          const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          
          this.logger.log(`Successfully generated AI comparison for "${query}"`);
          const aiProducts = parsed.map((item: any) => ({
            name: item.name,
            store: item.store,
            price: item.price,
            originalPrice: item.originalPrice || item.price,
            imgUrl: item.imgUrl || '',
            imageUrl: item.imgUrl || '',
            category: item.category || 'Inne',
            barcode: '',
            discountPrice: null,
            validUntil: null,
            unit: '1 szt.'
          }));

          // Save AI results to DB temporarily so they are cached
          await this.bulkUpsert(aiProducts);

          // Return AI results directly
          return aiProducts.map((p, idx) => ({
            ...p,
            id: `ai-compare-${idx}-${Math.random().toString().slice(2, 6)}`
          })) as any[];
        }
      } catch (err: any) {
        this.logger.error(`AI price comparison estimation failed: ${err.message}`);
      }
    }

    return [];
  }

  private async scrapeBlixSearch(query: string): Promise<Partial<Product>[]> {
    const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    try {
      const url = 'https://blix.pl/szukaj/';
      const params = new URLSearchParams();
      params.append('szukaj', query);
      
      const response = await axios.post(url, params.toString(), {
        headers: {
          'User-Agent': USER_AGENT,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);

      // 1. Build mapping of leafletId -> brand
      const leafletToBrand = new Map();
      $('.leaflet').each((i, el) => {
        const leafletId = $(el).attr('data-leaflet-id');
        const brandName = $(el).attr('data-brand-name');
        const brandSlug = $(el).attr('data-brand-slug');
        if (leafletId && brandSlug) {
          leafletToBrand.set(leafletId, { name: brandName || '', slug: brandSlug.toLowerCase() });
        }
      });

      // 2. Extract window.offers JSON
      let offersText = '';
      $('script').each((i, el) => {
        const text = $(el).text();
        if (text.includes('window.offers')) {
          const idx = text.indexOf('window.offers');
          const start = text.indexOf('[', idx);
          const end = text.lastIndexOf(']');
          if (start !== -1 && end !== -1 && end > start) {
            offersText = text.substring(start, end + 1);
          }
        }
      });

      if (!offersText) {
        return [];
      }

      const offers = JSON.parse(offersText);
      const targetStores = ['biedronka', 'lidl', 'kaufland'];
      const products: Partial<Product>[] = [];

      for (const off of offers) {
        const leafletId = String(off.leafletId);
        const brand = leafletToBrand.get(leafletId);
        
        // Filter to Biedronka, Lidl, Kaufland
        if (brand && targetStores.includes(brand.slug)) {
          const priceVal = off.price ? off.price / 100 : 0;
          if (priceVal > 0) {
            products.push({
              name: off.name,
              price: priceVal,
              originalPrice: off.originalPrice ? off.originalPrice / 100 : priceVal * 1.25,
              store: brand.slug,
              imgUrl: off.image || '',
              imageUrl: off.image || '',
              category: 'Inne',
              barcode: '',
              discountPrice: null,
              validUntil: off.dateEnd?.date ? off.dateEnd.date.split(' ')[0] : null,
              unit: '1 szt.'
            });
          }
        }
      }

      this.logger.log(`Scraped ${products.length} products on-demand from Blix search for "${query}"`);
      return products;
    } catch (err: any) {
      this.logger.error(`Error scraping Blix search for "${query}": ${err.message}`);
      return [];
    }
  }

  async create(data: Partial<Product>): Promise<Product> {
    const product = new this.productModel(data);
    return product.save();
  }

  async bulkUpsert(products: Partial<Product>[]): Promise<any> {
    const ops = products.map(p => ({
      updateOne: {
        filter: { name: p.name, store: p.store },
        update: { $set: p },
        upsert: true,
      },
    }));
    return this.productModel.bulkWrite(ops);
  }

  async count(store?: string): Promise<number> {
    const filter = store ? { store } : {};
    return this.productModel.countDocuments(filter).exec();
  }
}

