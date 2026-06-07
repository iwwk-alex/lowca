import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReceiptsService } from './receipts.service';
import { OcrService } from './ocr.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('receipts')
@UseGuards(JwtAuthGuard)
export class ReceiptsController {
  constructor(
    private readonly receiptsService: ReceiptsService,
    private readonly ocrService: OcrService,
  ) {}

  /** GET /receipts — all receipts for logged-in user */
  @Get()
  findAll(@Request() req: any) {
    return this.receiptsService.findAll(req.user.sub);
  }

  /** GET /receipts/stats — spending statistics */
  @Get('stats')
  getStats(@Request() req: any) {
    return this.receiptsService.getStats(req.user.sub);
  }

  /** GET /receipts/:id — single receipt */
  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.receiptsService.findOne(req.user.sub, id);
  }

  /** POST /receipts — save scanned receipt */
  @Post()
  create(@Request() req: any, @Body() body: any) {
    return this.receiptsService.create(req.user.sub, body);
  }

  /** POST /receipts/scan — OCR scan receipt file */
  @Post('scan')
  @UseInterceptors(FileInterceptor('file'))
  async scanReceipt(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No receipt image file uploaded');
    }
    const parsedData = await this.ocrService.recognizeAndParse(file.buffer);
    return parsedData;
  }

  /** PUT /receipts/:id — update receipt */
  @Put(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.receiptsService.update(req.user.sub, id, body);
  }

  /** DELETE /receipts/:id — delete receipt */
  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.receiptsService.remove(req.user.sub, id);
  }
}
