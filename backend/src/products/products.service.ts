import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';

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
    return this.productModel
      .find({ $or: [{ name: regex }, { category: regex }] })
      .limit(50)
      .exec();
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

