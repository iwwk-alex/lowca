import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PantryController } from './pantry.controller';
import { PantryService } from './pantry.service';
import { ShoppingItem, ShoppingItemSchema } from './schemas/shopping-item.schema';
import { PantryItem, PantryItemSchema } from './schemas/pantry-item.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShoppingItem.name, schema: ShoppingItemSchema },
      { name: PantryItem.name, schema: PantryItemSchema },
    ]),
    AuthModule, // needed for JwtAuthGuard
  ],
  controllers: [PantryController],
  providers: [PantryService],
  exports: [PantryService],
})
export class PantryModule {}
