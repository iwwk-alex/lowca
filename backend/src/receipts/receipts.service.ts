import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Receipt, ReceiptDocument } from './receipt.schema';

@Injectable()
export class ReceiptsService {
  constructor(@InjectModel(Receipt.name) private receiptModel: Model<ReceiptDocument>) {}

  async findAll(userId: string): Promise<Receipt[]> {
    return this.receiptModel
      .find({ userId })
      .sort({ date: -1 })
      .exec();
  }

  async findOne(userId: string, id: string): Promise<Receipt> {
    const receipt = await this.receiptModel.findOne({ _id: id, userId }).exec();
    if (!receipt) throw new NotFoundException('Receipt not found');
    return receipt;
  }

  async create(userId: string, data: Partial<Receipt>): Promise<Receipt> {
    const receipt = new this.receiptModel({
      userId,
      store: data.store || 'other',
      date: data.date || new Date().toISOString(),
      total: data.total || 0,
      items: data.items || [],
      imageUrl: data.imageUrl || '',
      notes: data.notes || '',
    });
    return receipt.save();
  }

  async update(userId: string, id: string, data: Partial<Receipt>): Promise<Receipt> {
    const updated = await this.receiptModel
      .findOneAndUpdate(
        { _id: id, userId },
        {
          store: data.store,
          date: data.date,
          total: data.total,
          items: data.items,
          notes: data.notes,
        },
        { new: true },
      )
      .exec();
    if (!updated) throw new NotFoundException('Receipt not found');
    return updated;
  }

  async remove(userId: string, id: string): Promise<{ success: boolean }> {
    const result = await this.receiptModel.deleteOne({ _id: id, userId }).exec();
    if (result.deletedCount === 0) throw new NotFoundException('Receipt not found');
    return { success: true };
  }

  async getStats(userId: string): Promise<any> {
    const receipts = await this.receiptModel.find({ userId }).exec();
    const total = receipts.reduce((sum, r) => sum + r.total, 0);
    const byStore: Record<string, { count: number; total: number }> = {};

    for (const r of receipts) {
      if (!byStore[r.store]) byStore[r.store] = { count: 0, total: 0 };
      byStore[r.store].count++;
      byStore[r.store].total += r.total;
    }

    return {
      totalReceipts: receipts.length,
      totalSpent: Math.round(total * 100) / 100,
      byStore,
    };
  }
}
