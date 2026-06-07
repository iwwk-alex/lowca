import { Module } from '@nestjs/common';
import { LeafletsService } from './leaflets.service';
import { LeafletsController } from './leaflets.controller';

@Module({
  providers: [LeafletsService],
  controllers: [LeafletsController],
  exports: [LeafletsService],
})
export class LeafletsModule {}
