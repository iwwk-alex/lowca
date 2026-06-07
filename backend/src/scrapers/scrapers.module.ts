import { Module } from '@nestjs/common';
import { ScrapersService } from './scrapers.service';

@Module({
  providers: [ScrapersService],
  exports: [ScrapersService],
})
export class ScrapersModule {}
