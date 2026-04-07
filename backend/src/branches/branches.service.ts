import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { AuditService } from '../audit/audit.service';
import { branches } from '../db/schema';
import { AUDIT_TYPE } from '../db/constants';
import { CreateBranchDto } from './dto/create-branch.dto';

@Injectable()
export class BranchesService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly audit: AuditService,
  ) {}

  async findAll() {
    return this.drizzle.db
      .select()
      .from(branches)
      .where(isNull(branches.deletedAt))
      .orderBy(branches.name);
  }

  async findActive() {
    return this.drizzle.db
      .select()
      .from(branches)
      .where(and(eq(branches.isActive, true), isNull(branches.deletedAt)))
      .orderBy(branches.name);
  }

  async findOne(id: string) {
    const [branch] = await this.drizzle.db
      .select()
      .from(branches)
      .where(and(eq(branches.id, id), isNull(branches.deletedAt)));
    if (!branch) throw new NotFoundException(`Branch ${id} not found`);
    return branch;
  }

  async create(dto: CreateBranchDto, performedBy?: string) {
    const [created] = await this.drizzle.db
      .insert(branches)
      .values({
        name: dto.name,
        streetName: dto.streetName ?? null,
        barangay: dto.barangay ?? null,
        city: dto.city ?? null,
        province: dto.province ?? null,
        country: dto.country ?? null,
        phone: dto.phone ?? null,
        createdById: performedBy ?? null,
      })
      .returning();

    await this.audit.log({
      action: `Created branch: ${created.name}`,
      auditType: AUDIT_TYPE.BRANCH_CREATED,
      entityType: 'branch',
      entityId: String(created.id),
      source: 'admin',
      performedBy,
      details: { name: created.name, phone: created.phone },
    });

    return created;
  }

  async update(
    id: string,
    dto: Partial<CreateBranchDto> & { isActive?: boolean },
    performedBy?: string,
  ) {
    const existing = await this.findOne(id);

    const [updated] = await this.drizzle.db
      .update(branches)
      .set(dto)
      .where(eq(branches.id, id))
      .returning();

    const isDeactivation = dto.isActive === false && Object.keys(dto).length === 1;
    await this.audit.log({
      action: isDeactivation
        ? `Deactivated branch: ${existing.name}`
        : `Updated branch: ${existing.name}`,
      auditType: isDeactivation ? AUDIT_TYPE.BRANCH_DELETED : AUDIT_TYPE.BRANCH_UPDATED,
      entityType: 'branch',
      entityId: String(id),
      source: 'admin',
      performedBy,
      details: { before: existing, after: updated },
    });

    return updated;
  }

  async softDelete(id: string, performedBy?: string) {
    const existing = await this.findOne(id);

    const [deleted] = await this.drizzle.db
      .update(branches)
      .set({ isActive: false, deletedAt: new Date() })
      .where(eq(branches.id, id))
      .returning();

    await this.audit.log({
      action: `Deleted branch: ${existing.name}`,
      auditType: AUDIT_TYPE.BRANCH_DELETED,
      entityType: 'branch',
      entityId: String(id),
      source: 'admin',
      performedBy,
      details: { name: existing.name },
    });

    return deleted;
  }
}
