import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ShoppingItem, ShoppingItemDocument } from './schemas/shopping-item.schema';
import { PantryItem, PantryItemDocument } from './schemas/pantry-item.schema';

@Injectable()
export class PantryService {
  constructor(
    @InjectModel(ShoppingItem.name) private shoppingModel: Model<ShoppingItemDocument>,
    @InjectModel(PantryItem.name) private pantryModel: Model<PantryItemDocument>,
  ) {}

  // ================= SHOPPING LIST =================

  async getShoppingList(userId: string): Promise<ShoppingItem[]> {
    return this.shoppingModel.find({ userId }).exec();
  }

  async saveShoppingItem(userId: string, data: any): Promise<ShoppingItem> {
    if (data.id || data._id) {
      const id = data.id || data._id;
      const updated = await this.shoppingModel.findOneAndUpdate(
        { _id: id, userId },
        {
          name: data.name,
          store: data.store,
          price: data.price,
          quantity: data.quantity,
          bought: data.bought,
        },
        { new: true }
      ).exec();
      if (!updated) throw new NotFoundException('Item not found');
      return updated;
    } else {
      const newItem = new this.shoppingModel({
        userId,
        name: data.name,
        store: data.store,
        price: data.price,
        quantity: data.quantity,
        bought: data.bought || false,
      });
      return newItem.save();
    }
  }

  async deleteShoppingItem(userId: string, id: string): Promise<any> {
    const result = await this.shoppingModel.deleteOne({ _id: id, userId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Item not found or access denied');
    }
    return { success: true };
  }

  async clearShoppingList(userId: string): Promise<any> {
    await this.shoppingModel.deleteMany({ userId }).exec();
    return { success: true };
  }

  // ================= PANTRY TRACKER =================

  async getPantry(userId: string): Promise<PantryItem[]> {
    return this.pantryModel.find({ userId }).exec();
  }

  async savePantryItem(userId: string, data: any): Promise<PantryItem> {
    if (data.id || data._id) {
      const id = data.id || data._id;
      const updated = await this.pantryModel.findOneAndUpdate(
        { _id: id, userId },
        {
          name: data.name,
          store: data.store,
          quantity: data.quantity,
          expiryPreset: data.expiryPreset,
          consumed: data.consumed,
          purchaseDate: data.purchaseDate,
        },
        { new: true }
      ).exec();
      if (!updated) throw new NotFoundException('Pantry item not found');
      return updated;
    } else {
      const newItem = new this.pantryModel({
        userId,
        name: data.name,
        store: data.store,
        quantity: data.quantity,
        expiryPreset: data.expiryPreset || 'week',
        consumed: data.consumed || false,
        purchaseDate: data.purchaseDate || new Date().toISOString(),
      });
      return newItem.save();
    }
  }

  async deletePantryItem(userId: string, id: string): Promise<any> {
    const result = await this.pantryModel.deleteOne({ _id: id, userId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Pantry item not found or access denied');
    }
    return { success: true };
  }

  async bulkAddPantry(userId: string, items: any[]): Promise<PantryItem[]> {
    const documents = items.map(item => ({
      userId,
      name: item.name,
      store: item.store || 'biedronka',
      quantity: item.quantity || 1,
      expiryPreset: item.expiryPreset || 'week',
      consumed: false,
      purchaseDate: new Date().toISOString(),
    }));
    return this.pantryModel.insertMany(documents);
  }
}
