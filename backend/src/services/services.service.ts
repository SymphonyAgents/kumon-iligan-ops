import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { services } from '../db/schema';
import { AuditService } from '../audit/audit.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { toScaled, fromScaled } from '../utils/money';

@Injectable()
export class ServicesService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly audit: AuditService,
  ) {}

  async findAll(activeOnly = false) {
    const query = this.drizzle.db.select().from(services);
    const rows = activeOnly
      ? await query.where(eq(services.isActive, true))
      : await query;
    return rows.map((s) => ({ ...s, price: fromScaled(s.price) }));
  }

  async findOne(id: number) {
    const [service] = await this.drizzle.db
      .select()
      .from(services)
      .where(eq(services.id, id));
    if (!service) throw new NotFoundException(`Service ${id} not found`);
    return { ...service, price: fromScaled(service.price) };
  }

  async create(dto: CreateServiceDto, performedBy?: string) {
    const [created] = await this.drizzle.db
      .insert(services)
      .values({
        name: dto.name,
        type: dto.type,
        price: toScaled(dto.price),
        isActive: dto.isActive ?? true,
      })
      .returning();

    await this.audit.log({
      action: 'create',
      entityType: 'service',
      entityId: String(created.id),
      source: 'admin',
      performedBy,
      details: { name: created.name },
    });

    return { ...created, price: fromScaled(created.price) };
  }

  async update(id: number, dto: UpdateServiceDto, performedBy?: string) {
    const existing = await this.findOne(id);

    const { price: _price, ...rest } = dto;
    const setValues = {
      ...rest,
      ...(dto.price !== undefined && { price: toScaled(dto.price) }),
      updatedAt: new Date(),
    };

    const [updated] = await this.drizzle.db
      .update(services)
      .set(setValues)
      .where(eq(services.id, id))
      .returning();

    await this.audit.log({
      action: 'update',
      entityType: 'service',
      entityId: String(id),
      source: 'admin',
      performedBy,
      details: {
        before: existing,
        after: { ...updated, price: fromScaled(updated.price) },
      },
    });

    return { ...updated, price: fromScaled(updated.price) };
  }

  async remove(id: number, performedBy?: string) {
    const existing = await this.findOne(id);

    await this.drizzle.db
      .update(services)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(services.id, id));

    await this.audit.log({
      action: 'delete',
      entityType: 'service',
      entityId: String(id),
      source: 'admin',
      performedBy,
      details: { name: existing.name },
    });
  }
}
