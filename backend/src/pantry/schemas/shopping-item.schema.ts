import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ShoppingItemDocument = ShoppingItem & Document;

@Schema({ timestamps: true })
export class ShoppingItem {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  store: string;

  @Prop({ required: true, default: 0 })
  price: number;

  @Prop({ required: true, default: 1 })
  quantity: number;

  @Prop({ required: true, default: false })
  bought: boolean;
}

export const ShoppingItemSchema = SchemaFactory.createForClass(ShoppingItem);
