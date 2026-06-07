import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PantryService } from './pantry.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('pantry')
@UseGuards(JwtAuthGuard)
export class PantryController {
  constructor(private readonly pantryService: PantryService) {}

  // ===== SHOPPING LIST =====

  @Get('shopping')
  getShoppingList(@Request() req: any) {
    return this.pantryService.getShoppingList(req.user.sub);
  }

  @Post('shopping')
  saveShoppingItem(@Request() req: any, @Body() body: any) {
    return this.pantryService.saveShoppingItem(req.user.sub, body);
  }

  @Delete('shopping/:id')
  deleteShoppingItem(@Request() req: any, @Param('id') id: string) {
    return this.pantryService.deleteShoppingItem(req.user.sub, id);
  }

  @Delete('shopping')
  clearShoppingList(@Request() req: any) {
    return this.pantryService.clearShoppingList(req.user.sub);
  }

  // ===== PANTRY TRACKER =====

  @Get()
  getPantry(@Request() req: any) {
    return this.pantryService.getPantry(req.user.sub);
  }

  @Post()
  savePantryItem(@Request() req: any, @Body() body: any) {
    return this.pantryService.savePantryItem(req.user.sub, body);
  }

  @Delete(':id')
  deletePantryItem(@Request() req: any, @Param('id') id: string) {
    return this.pantryService.deletePantryItem(req.user.sub, id);
  }

  @Post('bulk')
  bulkAddPantry(@Request() req: any, @Body() body: any[]) {
    return this.pantryService.bulkAddPantry(req.user.sub, body);
  }
}
