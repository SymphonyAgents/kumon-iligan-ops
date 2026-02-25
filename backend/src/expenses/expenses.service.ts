import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, sql, gte, lte, and } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { expenses } from '../db/schema';
import { AuditService } from '../audit/audit.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly audit: AuditService,
  ) {}

  async findByMonth(year: number, month: number) {
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return this.drizzle.db
      .select()
      .from(expenses)
      .where(and(gte(expenses.dateKey, from), lte(expenses.dateKey, to)));
  }

  async findByDate(dateKey: string) {
    return this.drizzle.db
      .select()
      .from(expenses)
      .where(eq(expenses.dateKey, dateKey));
  }

  async summary(dateKey: string) {
    const [result] = await this.drizzle.db
      .select({ total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)` })
      .from(expenses)
      .where(eq(expenses.dateKey, dateKey));
    return { dateKey, total: result?.total ?? '0' };
  }

  async findOne(id: number) {
    const [expense] = await this.drizzle.db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id));
    if (!expense) throw new NotFoundException(`Expense ${id} not found`);
    return expense;
  }

  async create(dto: CreateExpenseDto, source = 'pos', performedBy?: string) {
    const [created] = await this.drizzle.db
      .insert(expenses)
      .values({
        dateKey: dto.dateKey,
        category: dto.category ?? null,
        note: dto.note ?? null,
        amount: dto.amount,
      })
      .returning();

    await this.audit.log({
      action: 'create',
      entityType: 'expense',
      entityId: String(created.id),
      source,
      performedBy,
      details: { amount: created.amount, category: created.category },
    });

    return created;
  }

  async update(id: number, dto: UpdateExpenseDto, performedBy?: string) {
    await this.findOne(id);

    const [updated] = await this.drizzle.db
      .update(expenses)
      .set(dto)
      .where(eq(expenses.id, id))
      .returning();

    await this.audit.log({
      action: 'update',
      entityType: 'expense',
      entityId: String(id),
      source: 'pos',
      performedBy,
    });

    return updated;
  }

  async remove(id: number, performedBy?: string) {
    await this.findOne(id);

    await this.drizzle.db.delete(expenses).where(eq(expenses.id, id));

    await this.audit.log({
      action: 'delete',
      entityType: 'expense',
      entityId: String(id),
      source: 'pos',
      performedBy,
    });
  }
}
