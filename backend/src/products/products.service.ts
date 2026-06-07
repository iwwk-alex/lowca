import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly filePath = path.join(__dirname, '../../../frontend/public/scraped-data.json');

  findAll(store?: string): any[] {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8');
        const items = JSON.parse(data);
        if (store) {
          return items.filter((item: any) => item.store === store.toLowerCase());
        }
        return items;
      }
      this.logger.warn(`Scraped data file not found at ${this.filePath}`);
      return [];
    } catch (error) {
      this.logger.error(`Error reading products: ${error.message}`);
      return [];
    }
  }

  search(query: string): any[] {
    try {
      if (!query) return [];
      const items = this.findAll();
      const lowerQuery = query.toLowerCase().trim();
      return items.filter((item: any) => 
        item.name.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      this.logger.error(`Error searching products: ${error.message}`);
      return [];
    }
  }
}
