import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CardBanksService } from './card-banks.service';
import { CreateCardBankDto } from './dto/create-card-bank.dto';
import { UpdateCardBankDto } from './dto/update-card-bank.dto';

@Controller('card-banks')
@UseGuards(AuthGuard)
export class CardBanksController {
  constructor(private readonly cardBanksService: CardBanksService) {}

  /** Any authenticated user — used to populate dropdowns */
  @Get()
  findAll() {
    return this.cardBanksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cardBanksService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('superadmin')
  create(@Body() dto: CreateCardBankDto) {
    return this.cardBanksService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('superadmin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCardBankDto) {
    return this.cardBanksService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('superadmin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cardBanksService.remove(id);
  }
}
