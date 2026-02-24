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
  ) {
    return this.transactionsService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
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
  create(@Body() dto: CreateTransactionDto, @Req() req: any) {
    return this.transactionsService.create(dto, 'pos', req.user?.id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTransactionDto,
    @Req() req: any,
  ) {
    return this.transactionsService.update(id, dto, 'pos', req.user?.id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateItemDto,
    @Req() req: any,
  ) {
    return this.transactionsService.updateItem(id, itemId, dto, req.user?.id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Post(':id/payments')
  addPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddPaymentDto,
    @Req() req: any,
  ) {
    return this.transactionsService.addPayment(id, dto, req.user?.id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.transactionsService.remove(id, req.user?.id);
  }
}
