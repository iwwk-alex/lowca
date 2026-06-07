import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { ProductsService } from '../products/products.service';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

@Injectable()
export class ScrapersService implements OnModuleInit {
  private readonly logger = new Logger(ScrapersService.name);
  private readonly publicDir = path.join(__dirname, '../../../frontend/public');
  private readonly filePath = path.join(this.publicDir, 'scraped-data.json');

  constructor(
    private readonly productsService: ProductsService
  ) {}

  async onModuleInit() {
    this.logger.log('ScrapersService initialized. Checking for existing scraped data...');
    if (!fs.existsSync(this.filePath)) {
      this.logger.log('No scraped data found. Running initial scraper run...');
      await this.handleDailyScraping();
    } else {
      this.logger.log('Scraped data already exists. Checking size...');
      try {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        if (data.length < 50) {
          this.logger.log('Scraped data has too few items. Re-running scraping...');
          await this.handleDailyScraping();
        } else {
          this.logger.log('Scraped data already exists with enough items. Skipping initial run.');
          // Sync to database just in case
          await this.syncToDatabase(data);
        }
      } catch (err) {
        this.logger.log('Error reading scraped data. Re-running scraping...');
        await this.handleDailyScraping();
      }
    }
  }

  private async syncToDatabase(data: any[]) {
    try {
      this.logger.log(`Syncing ${data.length} scraped products to MongoDB...`);
      const mappedProducts = data.map(item => ({
        store: item.store,
        name: item.name,
        price: item.price,
        originalPrice: item.price * 1.25, // Mock original price for saving calculations
        imgUrl: item.imgUrl,
        category: 'Inne',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // Valid for 1 week
      }));
      await this.productsService.bulkUpsert(mappedProducts);
      this.logger.log('Successfully upserted products to database.');
    } catch (err) {
      this.logger.error('Failed to sync products to database:', err.message);
    }
  }

  /**
   * Daily Cron job at 3:00 AM to fetch new leaflets and promotions
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleDailyScraping() {
    this.logger.log('Starting daily scraping pipeline from Blix...');
    
    try {
      const biedronkaData = await this.scrapeStore('biedronka', 'https://blix.pl/sklep/biedronka/');
      const lidlData = await this.scrapeStore('lidl', 'https://blix.pl/sklep/lidl/');
      const kauflandData = await this.scrapeStore('kaufland', 'https://blix.pl/sklep/kaufland/');

      const allItems = [...biedronkaData, ...lidlData, ...kauflandData];
      this.logger.log(`Scraping complete. Total items found: ${allItems.length}`);

      if (allItems.length > 0) {
        // Save locally for fallback
        try {
          if (!fs.existsSync(this.publicDir)) {
            fs.mkdirSync(this.publicDir, { recursive: true });
          }
          fs.writeFileSync(this.filePath, JSON.stringify(allItems, null, 2));
          this.logger.log(`Saved scraped products to: ${this.filePath}`);
        } catch (fErr) {
          this.logger.warn('Could not write JSON file locally (probably running in cloud):', fErr.message);
        }

        // Sync to MongoDB database so both backend and Vercel frontend can use it
        await this.syncToDatabase(allItems);
      }
    } catch (error) {
      this.logger.error('Scraping pipeline failed:', error.message);
    }
  }

  /**
   * Scrapes a store from Blix.pl aggregator
   */
  async scrapeStore(storeName: string, url: string): Promise<any[]> {
    this.logger.log(`Scraping ${storeName.toUpperCase()} from Blix: ${url}`);
    const items: any[] = [];
    
    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': USER_AGENT }
      });
      const $ = cheerio.load(response.data);
      
      $('.product').each((i, el) => {
        // Limit to 40 products per store to keep it compact but representative
        if (items.length >= 40) return;
        
        const name = $(el).find('.product__name').text().trim();
        const priceStr = $(el).find('.product__price').text().trim();
        
        // Get image from data-src or src attribute
        let imgUrl = $(el).find('.product__img').attr('data-src') || $(el).find('.product__img').attr('src') || '';
        if (imgUrl && imgUrl.startsWith('/')) {
          imgUrl = `https://blix.pl${imgUrl}`;
        }
        
        // Parse Polish currency format, e.g. "14,99 zł" -> 14.99
        const parsedPrice = parseFloat(priceStr.replace('&nbsp;', ' ').replace(',', '.').replace(/[^0-9.]/g, ''));
        
        if (name && !isNaN(parsedPrice)) {
          items.push({
            id: `${storeName}-${i}`,
            store: storeName,
            name: name.replace(/\s+/g, ' '),
            price: parsedPrice,
            imgUrl,
            promoText: 'Promocja gazetkowa'
          });
        }
      });
      
      this.logger.log(`Successfully scraped ${storeName}. Found ${items.length} products.`);
      return items;
    } catch (err) {
      this.logger.error(`Error scraping ${storeName}: ${err.message}`);
      return [];
    }
  }
}
