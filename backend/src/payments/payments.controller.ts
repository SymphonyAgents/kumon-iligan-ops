import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthedRequest } from '../auth/auth.types.js';
import { PaymentsService } from './payments.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { VerifyPaymentDto } from './dto/verify-payment.dto.js';
import { FlagPaymentDto } from './dto/flag-payment.dto.js';
import { RejectPaymentDto } from './dto/reject-payment.dto.js';
import { QueryPaymentsDto } from './dto/query-payments.dto.js';

@Controller('payments')
@UseGuards(AuthGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  findAll(@Query() query: QueryPaymentsDto, @Req() req: AuthedRequest) {
    return this.payments.findAll(query, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.payments.findOne(id, req.user.id);
  }

  @Post()
  record(@Body() dto: CreatePaymentDto, @Req() req: AuthedRequest) {
    return this.payments.record(dto, req.user.id);
  }

  @Patch(':id/verify')
  verify(
    @Param('id') id: string,
    @Body() dto: VerifyPaymentDto,
    @Req() req: AuthedRequest,
  ) {
    return this.payments.verify(id, dto, req.user.id);
  }

  @Patch(':id/flag')
  flag(
    @Param('id') id: string,
    @Body() dto: FlagPaymentDto,
    @Req() req: AuthedRequest,
  ) {
    return this.payments.flag(id, dto, req.user.id);
  }

  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectPaymentDto,
    @Req() req: AuthedRequest,
  ) {
    return this.payments.reject(id, dto, req.user.id);
  }
}
