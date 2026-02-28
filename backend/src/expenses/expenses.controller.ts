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
  Req,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { AuthedRequest } from '../auth/auth.types';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // Requires auth — financial data must not be public
  @UseGuards(SupabaseAuthGuard)
  @Get()
  findByDate(@Query('date') date: string) {
    return this.expensesService.findByDate(date);
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('summary')
  summary(@Query('date') date: string) {
    return this.expensesService.summary(date);
  }

  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('monthly')
  findByMonth(@Query('year') year: string, @Query('month') month: string) {
    return this.expensesService.findByMonth(
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }

  // Any authenticated user can log an expense (staff via POS)
  @UseGuards(SupabaseAuthGuard)
  @Post()
  create(@Body() dto: CreateExpenseDto, @Req() req: AuthedRequest) {
    return this.expensesService.create(dto, 'pos', req.user?.id);
  }

  // Admin-only: edit or delete existing expenses
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseDto,
    @Req() req: AuthedRequest,
  ) {
    return this.expensesService.update(id, dto, req.user?.id);
  }

  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthedRequest) {
    return this.expensesService.remove(id, req.user?.id);
  }
}
