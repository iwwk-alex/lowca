import { Controller, Get } from '@nestjs/common';
import { LeafletsService } from './leaflets.service';

@Controller('leaflets')
export class LeafletsController {
  constructor(private readonly leafletsService: LeafletsService) {}

  @Get()
  getLeaflets() {
    return this.leafletsService.findAll();
  }
}
