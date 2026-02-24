import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../db/drizzle.service';
import { auditLog } from '../db/schema';

interface LogActionParams {
  action: string;
  entityType: string;
  entityId?: string;
  source?: string;
  performedBy?: string;
  details?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(private readonly drizzle: DrizzleService) {}

  async log(params: LogActionParams): Promise<void> {
    await this.drizzle.db.insert(auditLog).values({
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      source: params.source ?? null,
      performedBy: params.performedBy ?? null,
      details: params.details ?? null,
    });
  }
}
