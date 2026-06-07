import { Controller, Get, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  getProducts(@Query('store') store?: string) {
    return this.productsService.findAll(store);
  }

  @Get('search')
  searchProducts(@Query('q') query: string) {
    return this.productsService.search(query);
  }
}
