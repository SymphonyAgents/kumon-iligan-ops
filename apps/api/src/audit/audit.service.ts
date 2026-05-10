import { Injectable, Logger } from '@nestjs/common';
import { and, desc, eq, gte, getTableColumns, lte } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { auditLog, users } from '../db/schema';
import { AUDIT_TYPE } from '../db/constants';
import type { AuditType } from '../db/constants';

interface LogActionParams {
  action: string;
  auditType?: AuditType;
  entityType: string;
  entityId?: string;
  source?: string;
  performedBy?: string;
  branchId?: string;
  details?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly drizzle: DrizzleService) {}

  async findAll(params: { limit?: number; month?: number; year?: number; performedBy?: string; branchId?: string } = {}) {
    const { limit = 200, month, year, performedBy, branchId } = params;
    const conditions: ReturnType<typeof eq>[] = [];

    if (month && year) {
      const from = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00`);
      const lastDay = new Date(year, month, 0).getDate();
      const to = new Date(`${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59`);
      conditions.push(
        gte(auditLog.createdAt, from) as ReturnType<typeof eq>,
        lte(auditLog.createdAt, to) as ReturnType<typeof eq>,
      );
    }

    if (performedBy) {
      conditions.push(eq(auditLog.performedBy, performedBy));
    }

    if (branchId) {
      conditions.push(eq(auditLog.branchId, branchId) as ReturnType<typeof eq>);
    }

    return this.drizzle.db
      .select({
        ...getTableColumns(auditLog),
        performedByEmail: users.email,
        performedByFullName: users.fullName,
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.performedBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit);
  }

  async findByEntity(entityType: string, entityId: string, auditType?: string) {
    const conditions: ReturnType<typeof eq>[] = [
      eq(auditLog.entityType, entityType),
      eq(auditLog.entityId, entityId),
    ];
    if (auditType) {
      conditions.push(eq(auditLog.auditType, auditType));
    }
    return this.drizzle.db
      .select({
        ...getTableColumns(auditLog),
        performedByEmail: users.email,
        performedByFullName: users.fullName,
        performedByNickname: users.nickname,
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.performedBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(auditLog.createdAt))
      .limit(100);
  }

  async log(params: LogActionParams): Promise<void> {
    try {
      // Skip if entityId is missing — schema requires a non-null uuid
      if (!params.entityId) return;

      await this.drizzle.db.insert(auditLog).values({
        action: params.action,
        auditType: params.auditType ?? AUDIT_TYPE.DATA_EXPORTED,
        entityType: params.entityType,
        entityId: params.entityId,
        source: params.source ?? null,
        performedBy: params.performedBy ?? null,
        branchId: params.branchId ?? null,
        details: params.details ?? null,
      });
    } catch (error) {
      // Audit failures must never break primary operations
      this.logger.error(
        `[Audit] Failed to log: ${params.action} ${params.entityType}:${params.entityId ?? '?'} — ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
