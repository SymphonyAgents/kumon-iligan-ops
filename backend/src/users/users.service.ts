import { Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { users } from '../db/schema';
import type { UserType } from '../db/constants';

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

  async onboard(id: string, branchId: number) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const [updated] = await this.drizzle.db
      .update(users)
      .set({ branchId })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async getBranchId(userId: string): Promise<number | null> {
    const user = await this.findById(userId);
    return user?.branchId ?? null;
  }

  async findAll() {
    return this.drizzle.db.select().from(users).orderBy(asc(users.createdAt));
  }

  async updateUserType(id: string, userType: UserType) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const [updated] = await this.drizzle.db
      .update(users)
      .set({ userType })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async updateBranch(id: string, branchId: number) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const [updated] = await this.drizzle.db
      .update(users)
      .set({ branchId })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }
}
