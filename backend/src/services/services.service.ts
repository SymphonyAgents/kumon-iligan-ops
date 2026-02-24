import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { services } from '../db/schema';
import { AuditService } from '../audit/audit.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly audit: AuditService,
  ) {}

  async findAll(activeOnly = false) {
    const query = this.drizzle.db.select().from(services);
    if (activeOnly) {
      return query.where(eq(services.isActive, true));
    }
    return query;
  }

  async findOne(id: number) {
    const [service] = await this.drizzle.db
      .select()
      .from(services)
      .where(eq(services.id, id));
    if (!service) throw new NotFoundException(`Service ${id} not found`);
    return service;
  }

  async create(dto: CreateServiceDto, performedBy?: string) {
    const [created] = await this.drizzle.db
      .insert(services)
      .values({
        name: dto.name,
        type: dto.type,
        price: dto.price,
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

    return created;
  }

  async update(id: number, dto: UpdateServiceDto, performedBy?: string) {
    const existing = await this.findOne(id);

    const [updated] = await this.drizzle.db
      .update(services)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();

    await this.audit.log({
      action: 'update',
      entityType: 'service',
      entityId: String(id),
      source: 'admin',
      performedBy,
      details: { before: existing, after: updated },
    });

    return updated;
  }

  async remove(id: number, performedBy?: string) {
    await this.findOne(id);

    await this.drizzle.db.delete(services).where(eq(services.id, id));

    await this.audit.log({
      action: 'delete',
      entityType: 'service',
      entityId: String(id),
      source: 'admin',
      performedBy,
    });
  }
}
