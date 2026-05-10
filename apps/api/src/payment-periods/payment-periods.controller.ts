import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthedRequest } from '../auth/auth.types.js';
import { PaymentPeriodsService } from './payment-periods.service.js';
import { CreatePeriodDto } from './dto/create-period.dto.js';
import { UpdatePeriodDto } from './dto/update-period.dto.js';
import { BulkGeneratePeriodsDto } from './dto/bulk-generate-periods.dto.js';
import { QueryPeriodsDto } from './dto/query-periods.dto.js';

@Controller('payment-periods')
@UseGuards(AuthGuard)
export class PaymentPeriodsController {
  constructor(private readonly paymentPeriods: PaymentPeriodsService) {}

  @Get()
  findAll(@Query() query: QueryPeriodsDto, @Req() req: AuthedRequest) {
    return this.paymentPeriods.findAll(query, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.paymentPeriods.findOne(id, req.user.id);
  }

  @Post()
  create(@Body() dto: CreatePeriodDto, @Req() req: AuthedRequest) {
    return this.paymentPeriods.create(dto, req.user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePeriodDto,
    @Req() req: AuthedRequest,
  ) {
    return this.paymentPeriods.update(id, dto, req.user.id);
  }

  @Post('bulk-generate')
  bulkGenerate(@Body() dto: BulkGeneratePeriodsDto, @Req() req: AuthedRequest) {
    return this.paymentPeriods.bulkGenerate(dto, req.user.id);
  }

  @Delete(':id')
  softDelete(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.paymentPeriods.softDelete(id, req.user.id);
  }
}
