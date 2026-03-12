import { Injectable } from '@nestjs/common';
import { desc, eq, ne, and, sql } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { customers, transactions, transactionItems } from '../db/schema';

@Injectable()
export class CustomersService {
  constructor(private readonly drizzle: DrizzleService) {}

  async findAll() {
    return this.drizzle.db
      .select({
        id: customers.id,
        phone: customers.phone,
        name: customers.name,
        email: customers.email,
        streetName: customers.streetName,
        city: customers.city,
        country: customers.country,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
        shoesCount: sql<number>`cast(count(distinct ${transactionItems.id}) as int)`,
      })
      .from(customers)
      .leftJoin(transactions, eq(transactions.customerPhone, customers.phone))
      .leftJoin(
        transactionItems,
        and(
          eq(transactionItems.transactionId, transactions.id),
          ne(transactionItems.status, 'cancelled'),
        ),
      )
      .groupBy(customers.id)
      .orderBy(desc(customers.createdAt));
  }

  async findByPhone(phone: string) {
    const [customer] = await this.drizzle.db
      .select()
      .from(customers)
      .where(eq(customers.phone, phone));
    return customer ?? null;
  }

  async upsert(
    phone: string,
    name?: string | null,
    email?: string | null,
    streetName?: string | null,
    city?: string | null,
    country?: string | null,
  ) {
    const [result] = await this.drizzle.db
      .insert(customers)
      .values({
        phone,
        name: name ?? null,
        email: email ?? null,
        streetName: streetName ?? null,
        city: city ?? null,
        country: country ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: customers.phone,
        set: {
          name: name ?? null,
          email: email ?? null,
          streetName: streetName ?? null,
          city: city ?? null,
          country: country ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }
}
