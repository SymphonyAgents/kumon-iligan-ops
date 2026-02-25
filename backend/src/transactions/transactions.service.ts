import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, desc, sql, gte, lte, and, not, inArray } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { transactions, transactionItems, claimPayments } from '../db/schema';
import { TRANSACTION_STATUS } from '../db/constants';
import { AuditService } from '../audit/audit.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly audit: AuditService,
  ) {}

  // Generate next zero-padded transaction number using a DB sequence-safe query
  private async nextNumber(): Promise<string> {
    const [result] = await this.drizzle.db
      .select({
        max: sql<string>`COALESCE(MAX(CAST(${transactions.number} AS INTEGER)), 0)`,
      })
      .from(transactions);
    const next = parseInt(result?.max ?? '0', 10) + 1;
    return String(next).padStart(4, '0');
  }

  async findAll(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    return this.drizzle.db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findOne(id: number) {
    const [txn] = await this.drizzle.db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    if (!txn) throw new NotFoundException(`Transaction ${id} not found`);

    const items = await this.drizzle.db
      .select()
      .from(transactionItems)
      .where(eq(transactionItems.transactionId, id));

    const payments = await this.drizzle.db
      .select()
      .from(claimPayments)
      .where(eq(claimPayments.transactionId, id));

    return { ...txn, items, payments };
  }

  async findByNumber(number: string) {
    const [txn] = await this.drizzle.db
      .select()
      .from(transactions)
      .where(eq(transactions.number, number));
    if (!txn) throw new NotFoundException(`Transaction ${number} not found`);
    return this.findOne(txn.id);
  }

  async create(
    dto: CreateTransactionDto,
    source = 'pos',
    performedBy?: string,
  ) {
    const number = await this.nextNumber();

    const [created] = await this.drizzle.db
      .insert(transactions)
      .values({
        number,
        customerName: dto.customerName ?? null,
        customerPhone: dto.customerPhone ?? null,
        customerEmail: dto.customerEmail ?? null,
        status: dto.status ?? 'pending',
        pickupDate: dto.pickupDate ?? null,
        total: dto.total ?? '0',
        paid: dto.paid ?? '0',
        promoId: dto.promoId ?? null,
        updatedAt: new Date(),
      })
      .returning();

    if (dto.items?.length) {
      await this.drizzle.db.insert(transactionItems).values(
        dto.items.map((item) => ({
          transactionId: created.id,
          shoeDescription: item.shoeDescription ?? null,
          serviceId: item.serviceId ?? null,
          status: item.status ?? 'pending',
          beforeImageUrl: item.beforeImageUrl ?? null,
          afterImageUrl: item.afterImageUrl ?? null,
          price: item.price ?? null,
        })),
      );
    }

    await this.audit.log({
      action: 'create',
      entityType: 'transaction',
      entityId: created.number,
      source,
      performedBy,
      details: { number: created.number, customerName: created.customerName },
    });

    return this.findOne(created.id);
  }

  async update(
    id: number,
    dto: UpdateTransactionDto,
    source = 'pos',
    performedBy?: string,
  ) {
    const existing = await this.findOne(id);
    const prevStatus = existing.status;

    const setValues: Record<string, unknown> = {
      ...dto,
      updatedAt: new Date(),
    };
    if (
      dto.status === TRANSACTION_STATUS.CLAIMED &&
      prevStatus !== TRANSACTION_STATUS.CLAIMED
    ) {
      setValues.claimedAt = new Date();
    }

    const [updated] = await this.drizzle.db
      .update(transactions)
      .set(setValues)
      .where(eq(transactions.id, id))
      .returning();

    const action =
      dto.status && dto.status !== prevStatus ? 'status_change' : 'update';

    await this.audit.log({
      action,
      entityType: 'transaction',
      entityId: updated.number,
      source,
      performedBy,
      details:
        action === 'status_change'
          ? { from: prevStatus, to: dto.status }
          : { fields: Object.keys(dto) },
    });

    return this.findOne(id);
  }

  async findRecent(limit = 10) {
    return this.drizzle.db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async findUpcoming() {
    const today = new Date().toISOString().split('T')[0];
    const plus3 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    return this.drizzle.db
      .select()
      .from(transactions)
      .where(
        and(
          gte(transactions.pickupDate, today),
          lte(transactions.pickupDate, plus3),
          not(inArray(transactions.status, ['claimed', 'cancelled'])),
        ),
      )
      .orderBy(transactions.pickupDate);
  }

  async updateItem(
    transactionId: number,
    itemId: number,
    dto: UpdateItemDto,
    performedBy?: string,
  ) {
    const txn = await this.findOne(transactionId);

    const [existing] = await this.drizzle.db
      .select()
      .from(transactionItems)
      .where(eq(transactionItems.id, itemId));

    if (!existing) throw new NotFoundException(`Item ${itemId} not found`);

    const [updated] = await this.drizzle.db
      .update(transactionItems)
      .set(dto)
      .where(eq(transactionItems.id, itemId))
      .returning();

    if (dto.status && dto.status !== existing.status) {
      await this.audit.log({
        action: 'status_change',
        entityType: 'transaction_item',
        entityId: String(itemId),
        source: 'pos',
        performedBy,
        details: {
          transactionNumber: txn.number,
          from: existing.status,
          to: dto.status,
          shoe: existing.shoeDescription,
        },
      });
    }

    return updated;
  }

  async addPayment(id: number, dto: AddPaymentDto, performedBy?: string) {
    const txn = await this.findOne(id);

    const [payment] = await this.drizzle.db
      .insert(claimPayments)
      .values({
        transactionId: id,
        method: dto.method,
        amount: dto.amount,
      })
      .returning();

    const newPaid = (parseFloat(txn.paid) + parseFloat(dto.amount)).toFixed(2);
    await this.drizzle.db
      .update(transactions)
      .set({ paid: newPaid, updatedAt: new Date() })
      .where(eq(transactions.id, id));

    await this.audit.log({
      action: 'payment_add',
      entityType: 'transaction',
      entityId: txn.number,
      source: 'pos',
      performedBy,
      details: { method: dto.method, amount: dto.amount },
    });

    return payment;
  }

  async remove(id: number, performedBy?: string) {
    const txn = await this.findOne(id);

    await this.drizzle.db.delete(transactions).where(eq(transactions.id, id));

    await this.audit.log({
      action: 'delete',
      entityType: 'transaction',
      entityId: txn.number,
      source: 'admin',
      performedBy,
    });
  }
}
