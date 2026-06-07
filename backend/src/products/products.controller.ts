import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getProducts(
    @Query('store') store?: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    return this.productsService.findAll(store, limit ? +limit : 100, skip ? +skip : 0);
  }

  @Get('search')
  async searchProducts(@Query('q') query: string) {
    return this.productsService.search(query);
  }

  @Get('count')
  async countProducts(@Query('store') store?: string) {
    return { count: await this.productsService.count(store) };
  }

  @Post()
  async createProduct(@Body() body: any) {
    return this.productsService.create(body);
  }

  @Post('bulk')
  async bulkUpsert(@Body() body: any[]) {
    return this.productsService.bulkUpsert(body);
  }
}

