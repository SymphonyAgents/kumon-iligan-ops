import { Controller, Get, Patch, Body, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DepositsService } from './deposits.service';

@Controller('deposits')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class DepositsController {
  constructor(private readonly depositsService: DepositsService) {}

  @Get('audit')
  findDepositAudit(
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('branchId') branchId?: string,
    @Query('method') method?: string,
  ) {
    return this.depositsService.findDepositAudit(
      parseInt(year, 10),
      parseInt(month, 10),
      branchId ? parseInt(branchId, 10) : undefined,
      method || undefined,
    );
  }

  @Get()
  findByMonth(
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.depositsService.findByMonth(
      parseInt(year, 10),
      parseInt(month, 10),
      branchId ? parseInt(branchId, 10) : undefined,
    );
  }

  @Patch()
  upsert(
    @Body() body: { year: number; month: number; method: string; amount: string; branchId?: number },
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.depositsService.upsert(
      body.year,
      body.month,
      body.method,
      body.amount,
      body.branchId,
      req.user?.id,
    );
  }
}
