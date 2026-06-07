import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Card, CardDocument } from './schemas/card.schema';

@Injectable()
export class CardsService {
  constructor(@InjectModel(Card.name) private cardModel: Model<CardDocument>) {}

  async findAll(userId: string): Promise<Card[]> {
    return this.cardModel.find({ userId }).exec();
  }

  async create(userId: string, cardData: any): Promise<Card> {
    const newCard = new this.cardModel({
      userId,
      name: cardData.name,
      number: cardData.number,
      color: cardData.color,
    });
    return newCard.save();
  }

  async delete(userId: string, cardId: string): Promise<any> {
    const result = await this.cardModel.deleteOne({ _id: cardId, userId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Card not found or access denied');
    }
    return { success: true };
  }
}
