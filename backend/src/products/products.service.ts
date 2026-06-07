import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import axios from 'axios';

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
    
    const dbResults = await this.productModel
      .find({ $or: [{ name: regex }, { category: regex }] })
      .limit(50)
      .exec();

    if (dbResults.length > 0) {
      return dbResults;
    }

    // Fallback: If no results found in local database, query Gemini API for on-demand comparison
    if (process.env.GEMINI_API_KEY) {
      this.logger.log(`No database results for "${query}". Fetching real-time AI price estimates...`);
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const prompt = `You are a Polish grocery price comparison assistant. Estimate the current regular prices for the product "${query}" in Poland at Biedronka, Lidl, and Kaufland. Respond ONLY with a valid JSON array of objects. Do not wrap in markdown code blocks. JSON schema: [{"name": "Short name in Polish", "store": "biedronka"|"lidl"|"kaufland", "price": number, "originalPrice": number, "imgUrl": string, "category": "Inne"}]`;

        const payload = {
          contents: [{ parts: [{ text: prompt }] }]
        };

        const response = await axios.post(url, payload, { timeout: 8000 });
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (text) {
          const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          
          this.logger.log(`Successfully generated AI comparison for "${query}"`);
          return parsed.map((item: any, idx: number) => ({
            id: `ai-compare-${idx}-${Math.random().toString().slice(2, 6)}`,
            name: item.name,
            store: item.store,
            price: item.price,
            originalPrice: item.originalPrice || item.price,
            imgUrl: item.imgUrl || '',
            category: item.category || 'Inne',
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
          }));
        }
      } catch (err: any) {
        this.logger.error(`AI price comparison estimation failed: ${err.message}`);
      }
    }

    return [];
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

