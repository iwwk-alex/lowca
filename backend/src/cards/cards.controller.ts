import { Controller, Get, Post, Delete, Body, Query, Param } from '@nestjs/common';
import { CardsService } from './cards.service';

@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get()
  async getCards(@Query('userId') userId: string) {
    return this.cardsService.findAll(userId);
  }

  @Post()
  async createCard(@Query('userId') userId: string, @Body() body: any) {
    return this.cardsService.create(userId, body);
  }

  @Delete(':id')
  async deleteCard(@Param('id') id: string, @Query('userId') userId: string) {
    return this.cardsService.delete(userId, id);
  }
}
