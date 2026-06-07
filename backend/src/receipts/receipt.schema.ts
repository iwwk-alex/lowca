import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Embedded sub-document for individual receipt items
class ReceiptItem {
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) price: number;
  @Prop({ default: 1 }) quantity: number;
  @Prop({ default: '' }) barcode: string;
  @Prop({ default: '' }) category: string;
}

export type ReceiptDocument = Receipt & Document;

@Schema({ timestamps: true })
export class Receipt {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, enum: ['biedronka', 'lidl', 'kaufland', 'other'] })
  store: string;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  total: number;

  @Prop({ type: [Object], default: [] })
  items: ReceiptItem[];

  @Prop({ default: '' })
  imageUrl: string;

  @Prop({ default: '' })
  notes: string;
}

export const ReceiptSchema = SchemaFactory.createForClass(Receipt);
