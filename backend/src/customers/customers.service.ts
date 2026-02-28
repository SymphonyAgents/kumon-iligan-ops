import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { customers } from '../db/schema';

@Injectable()
export class CustomersService {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByPhone(phone: string) {
    const [customer] = await this.drizzle.db
      .select()
      .from(customers)
      .where(eq(customers.phone, phone));
    return customer ?? null;
  }

  async upsert(phone: string, name?: string | null, email?: string | null) {
    const [result] = await this.drizzle.db
      .insert(customers)
      .values({
        phone,
        name: name ?? null,
        email: email ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: customers.phone,
        set: {
          name: name ?? null,
          email: email ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }
}
