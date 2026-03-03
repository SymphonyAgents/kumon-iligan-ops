import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuditService } from './audit.service';

@Controller('audit')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(
    @Query('limit') limit?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('performedBy') performedBy?: string,
  ) {
    return this.auditService.findAll({
      limit: limit ? parseInt(limit, 10) : 200,
      month: month ? parseInt(month, 10) : undefined,
      year: year ? parseInt(year, 10) : undefined,
      performedBy,
    });
  }
}
