import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ScrapersModule } from './scrapers/scrapers.module';
import { ProductsModule } from './products/products.module';
import { LeafletsModule } from './leaflets/leaflets.module';
import { AuthModule } from './auth/auth.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { PantryModule } from './pantry/pantry.module';
import { CardsModule } from './cards/cards.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/lowca'),
    ScheduleModule.forRoot(), // Setup scheduling for cron scraping jobs
    AuthModule,
    ProductsModule,
    ReceiptsModule,
    PantryModule,
    CardsModule,
    ScrapersModule,
    LeafletsModule,
  ]
})
export class AppModule {}
