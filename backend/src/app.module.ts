import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ScrapersModule } from './scrapers/scrapers.module';
import { ProductsModule } from './products/products.module';
import { LeafletsModule } from './leaflets/leaflets.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Setup scheduling for cron scraping jobs
    ScrapersModule,
    ProductsModule,
    LeafletsModule
  ]
})
export class AppModule {}
