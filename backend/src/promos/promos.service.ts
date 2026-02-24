import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, lte, gte, or, isNull } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { promos } from '../db/schema';
import { AuditService } from '../audit/audit.service';
import { CreatePromoDto } from './dto/create-promo.dto';
import { UpdatePromoDto } from './dto/update-promo.dto';

@Injectable()
export class PromosService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly audit: AuditService,
  ) {}

  async findAll(activeOnly = false) {
    if (activeOnly) {
      const today = new Date().toISOString().split('T')[0];
      return this.drizzle.db
        .select()
        .from(promos)
        .where(
          and(
            eq(promos.isActive, true),
            or(isNull(promos.dateFrom), lte(promos.dateFrom, today)),
            or(isNull(promos.dateTo), gte(promos.dateTo, today)),
          ),
        );
    }
    return this.drizzle.db.select().from(promos);
  }

  async findOne(id: number) {
    const [promo] = await this.drizzle.db
      .select()
      .from(promos)
      .where(eq(promos.id, id));
    if (!promo) throw new NotFoundException(`Promo ${id} not found`);
    return promo;
  }

  async findByCode(code: string) {
    const today = new Date().toISOString().split('T')[0];
    const [promo] = await this.drizzle.db
      .select()
      .from(promos)
      .where(
        and(
          eq(promos.code, code),
          eq(promos.isActive, true),
          or(isNull(promos.dateFrom), lte(promos.dateFrom, today)),
          or(isNull(promos.dateTo), gte(promos.dateTo, today)),
        ),
      );
    return promo ?? null;
  }

  async create(dto: CreatePromoDto, performedBy?: string) {
    const [created] = await this.drizzle.db
      .insert(promos)
      .values({
        name: dto.name,
        code: dto.code.toUpperCase(),
        percent: dto.percent,
        dateFrom: dto.dateFrom ?? null,
        dateTo: dto.dateTo ?? null,
        isActive: dto.isActive ?? true,
      })
      .returning();

    await this.audit.log({
      action: 'create',
      entityType: 'promo',
      entityId: String(created.id),
      source: 'admin',
      performedBy,
      details: { code: created.code },
    });

    return created;
  }

  async update(id: number, dto: UpdatePromoDto, performedBy?: string) {
    const existing = await this.findOne(id);

    const [updated] = await this.drizzle.db
      .update(promos)
      .set({
        ...dto,
        code: dto.code ? dto.code.toUpperCase() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(promos.id, id))
      .returning();

    await this.audit.log({
      action: 'update',
      entityType: 'promo',
      entityId: String(id),
      source: 'admin',
      performedBy,
      details: { before: existing, after: updated },
    });

    return updated;
  }

  // Soft-delete — set isActive = false
  async remove(id: number, performedBy?: string) {
    await this.findOne(id);

    const [updated] = await this.drizzle.db
      .update(promos)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(promos.id, id))
      .returning();

    await this.audit.log({
      action: 'delete',
      entityType: 'promo',
      entityId: String(id),
      source: 'admin',
      performedBy,
    });

    return updated;
  }
}
