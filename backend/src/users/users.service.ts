import { Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq, and } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { AuditService } from '../audit/audit.service';
import { users } from '../db/schema';
import type { UserType } from '../db/constants';

@Injectable()
export class UsersService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly audit: AuditService,
  ) {}

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
    return this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.isActive, true))
      .orderBy(asc(users.createdAt));
  }

  async remove(id: string, performedBy?: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    await this.drizzle.db
      .update(users)
      .set({ isActive: false })
      .where(and(eq(users.id, id), eq(users.isActive, true)));

    await this.audit.log({
      action: `Deactivated user: ${user.email}`,
      entityType: 'user',
      entityId: id,
      source: 'admin',
      performedBy,
      details: { email: user.email },
    });
  }

  async updateUserType(id: string, userType: UserType, performedBy?: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const [updated] = await this.drizzle.db
      .update(users)
      .set({ userType })
      .where(eq(users.id, id))
      .returning();

    await this.audit.log({
      action: `Updated user role: ${user.email} → ${userType}`,
      entityType: 'user',
      entityId: id,
      source: 'admin',
      performedBy,
      details: { email: user.email, prevRole: user.userType, newRole: userType },
    });

    return updated;
  }

  async updateBranch(id: string, branchId: number, performedBy?: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const [updated] = await this.drizzle.db
      .update(users)
      .set({ branchId })
      .where(eq(users.id, id))
      .returning();

    await this.audit.log({
      action: `Updated user branch: ${user.email} → branch ${branchId}`,
      entityType: 'user',
      entityId: id,
      source: 'admin',
      performedBy,
      details: { email: user.email, prevBranchId: user.branchId, newBranchId: branchId },
    });

    return updated;
  }
}
