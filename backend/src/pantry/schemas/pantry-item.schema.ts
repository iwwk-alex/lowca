import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PantryItemDocument = PantryItem & Document;

@Schema({ timestamps: true })
export class PantryItem {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  store: string;

  @Prop({ required: true, default: 1 })
  quantity: number;

  @Prop({ required: true, default: () => new Date().toISOString() })
  purchaseDate: string;

  @Prop({ required: true, default: 'week' })
  expiryPreset: string; // 'day' | 'week' | 'month' | 'year'

  @Prop({ required: true, default: false })
  consumed: boolean;
}

export const PantryItemSchema = SchemaFactory.createForClass(PantryItem);
