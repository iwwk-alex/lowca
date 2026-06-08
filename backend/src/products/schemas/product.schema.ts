import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, index: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true, index: true, enum: ['biedronka', 'lidl', 'kaufland'] })
  store: string;

  @Prop({ default: 'other' })
  category: string;

  @Prop({ default: '' })
  imageUrl: string;

  @Prop({ default: '' })
  imgUrl: string;

  @Prop({ default: '' })
  barcode: string;

  @Prop({ default: null })
  discountPrice: number;

  @Prop({ default: null })
  originalPrice: number;

  @Prop({ default: null })
  validUntil: string;

  @Prop({ default: '' })
  unit: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ name: 'text', category: 'text' });
