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
import type { AuthedRequest } from '../auth/auth.types';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @UseGuards(SupabaseAuthGuard)
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.transactionsService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      status: status || undefined,
      search: search || undefined,
      from: from || undefined,
      to: to || undefined,
      branchId: branchId ? parseInt(branchId, 10) : undefined,
    });
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('recent')
  findRecent(@Query('limit') limit?: string) {
    return this.transactionsService.findRecent(
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('upcoming')
  findUpcoming() {
    return this.transactionsService.findUpcoming();
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('today-collections')
  todayCollections() {
    return this.transactionsService.todayCollections();
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('collections/summary')
  collectionsSummary(
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.transactionsService.collectionsSummary(
      parseInt(year, 10),
      parseInt(month, 10),
      branchId ? parseInt(branchId, 10) : undefined,
    );
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('number/:number')
  findByNumber(@Param('number') number: string) {
    return this.transactionsService.findByNumber(number);
  }

  @UseGuards(SupabaseAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transactionsService.findOne(id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Post()
  create(@Body() dto: CreateTransactionDto, @Req() req: AuthedRequest) {
    return this.transactionsService.create(dto, 'pos', req.user?.id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTransactionDto,
    @Req() req: AuthedRequest,
  ) {
    return this.transactionsService.update(id, dto, 'pos', req.user?.id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateItemDto,
    @Req() req: AuthedRequest,
  ) {
    return this.transactionsService.updateItem(id, itemId, dto, req.user?.id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Post(':id/payments')
  addPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddPaymentDto,
    @Req() req: AuthedRequest,
  ) {
    return this.transactionsService.addPayment(id, dto, req.user?.id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthedRequest) {
    return this.transactionsService.remove(id, req.user?.id);
  }
}
