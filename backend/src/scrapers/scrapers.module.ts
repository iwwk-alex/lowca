import { Module } from '@nestjs/common';
import { ScrapersService } from './scrapers.service';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ProductsModule],
  providers: [ScrapersService],
  exports: [ScrapersService],
})
export class ScrapersModule {}
