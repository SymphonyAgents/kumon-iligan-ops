import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { PromosService } from './promos.service';
import { CreatePromoDto } from './dto/create-promo.dto';
import { UpdatePromoDto } from './dto/update-promo.dto';

@Controller('promos')
export class PromosController {
  constructor(private readonly promosService: PromosService) {}

  // Public — POS reads active promos
  @Get()
  findAll(@Query('active') active?: string) {
    return this.promosService.findAll(active === '1' || active === 'true');
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.promosService.findByCode(code);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.promosService.findOne(id);
  }

  // Admin-only mutations
  @UseGuards(SupabaseAuthGuard)
  @Post()
  create(@Body() dto: CreatePromoDto, @Req() req: any) {
    return this.promosService.create(dto, req.user?.id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePromoDto,
    @Req() req: any,
  ) {
    return this.promosService.update(id, dto, req.user?.id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.promosService.remove(id, req.user?.id);
  }
}
