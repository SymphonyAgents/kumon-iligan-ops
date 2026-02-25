import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { users } from '../db/schema';

@Injectable()
export class UsersService {
  constructor(private readonly drizzle: DrizzleService) {}

  async findOrCreate(id: string, email: string) {
    const [existing] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.id, id));
    if (existing) return existing;

    const [created] = await this.drizzle.db
      .insert(users)
      .values({ id, email, userType: 'staff' })
      .returning();
    return created;
  }

  async findById(id: string) {
    const [user] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user ?? null;
  }
}
