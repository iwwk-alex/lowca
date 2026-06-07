import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReceiptsController } from './receipts.controller';
import { ReceiptsService } from './receipts.service';
import { OcrService } from './ocr.service';
import { Receipt, ReceiptSchema } from './receipt.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Receipt.name, schema: ReceiptSchema }]),
    AuthModule, // needed for JwtAuthGuard
  ],
  controllers: [ReceiptsController],
  providers: [ReceiptsService, OcrService],
  exports: [ReceiptsService, OcrService],
})
export class ReceiptsModule {}
