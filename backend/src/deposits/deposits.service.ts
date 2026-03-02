import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { deposits } from '../db/schema';
import { toScaled, fromScaled } from '../utils/money';

@Injectable()
export class DepositsService {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByMonth(year: number, month: number, branchId?: number) {
    const conditions = [eq(deposits.year, year), eq(deposits.month, month)];
    if (branchId) conditions.push(eq(deposits.branchId, branchId));

    const rows = await this.drizzle.db
      .select()
      .from(deposits)
      .where(and(...conditions));

    const result: Record<string, string> = {
      cash: '0.00',
      gcash: '0.00',
      card: '0.00',
      bank_deposit: '0.00',
    };
    rows.forEach((r) => {
      result[r.method] = fromScaled(r.amount);
    });
    return result;
  }

  async upsert(year: number, month: number, method: string, amount: string, branchId?: number) {
    const scaled = toScaled(amount);

    const existing = await this.drizzle.db
      .select()
      .from(deposits)
      .where(
        and(
          eq(deposits.year, year),
          eq(deposits.month, month),
          eq(deposits.method, method),
          branchId ? eq(deposits.branchId, branchId) : eq(deposits.branchId, null as unknown as number),
        ),
      );

    if (existing.length > 0) {
      const [updated] = await this.drizzle.db
        .update(deposits)
        .set({ amount: scaled, updatedAt: new Date() })
        .where(eq(deposits.id, existing[0].id))
        .returning();
      return { ...updated, amount: fromScaled(updated.amount) };
    }

    const [created] = await this.drizzle.db
      .insert(deposits)
      .values({ year, month, method, amount: scaled, branchId: branchId ?? null })
      .returning();
    return { ...created, amount: fromScaled(created.amount) };
  }
}
