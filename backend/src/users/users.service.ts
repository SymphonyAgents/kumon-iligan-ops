import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { asc, eq, and, sql, ne, isNull } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { AuditService } from '../audit/audit.service';
import { users, branches } from '../db/schema';
import { AUDIT_TYPE } from '../db/constants';
import type { UserType } from '../db/constants';
import type { UpdateUserProfileDto } from './dto/update-user-profile.dto';

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

    // First user ever → auto-superadmin + active (prevents lockout)
    const [{ count: userCount }] = await this.drizzle.db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const isFirstUser = Number(userCount) === 0;

    const [created] = await this.drizzle.db
      .insert(users)
      .values({
        id,
        email,
        userType: isFirstUser ? 'superadmin' : 'teacher',
        status: isFirstUser ? 'active' : 'pending',
      })
      .returning();

    await this.audit.log({
      action: `New user provisioned: ${email}`,
      auditType: AUDIT_TYPE.USER_CREATED,
      entityType: 'user',
      entityId: created.id,
      source: 'web',
      performedBy: created.id,
      details: { email, userType: created.userType, status: created.status },
    });

    return created;
  }

  async findById(id: string) {
    const [user] = await this.drizzle.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)));
    return user ?? null;
  }

  /** Full user record including branchId and userType -- used by service-layer RBAC. */
  async findByIdFull(id: string) {
    const [user] = await this.drizzle.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)));
    return user ?? null;
  }

  async onboard(id: string, branchId: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    // Verify the branch exists and is active
    const [branch] = await this.drizzle.db
      .select({ id: branches.id })
      .from(branches)
      .where(and(eq(branches.id, branchId), eq(branches.isActive, true)));
    if (!branch) throw new NotFoundException('Branch not found or inactive');

    const [updated] = await this.drizzle.db
      .update(users)
      .set({ branchId })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async getBranchId(userId: string): Promise<string | null> {
    const user = await this.findById(userId);
    return user?.branchId ?? null;
  }

  async findAll(branchId?: string) {
    // Show active + pending users (not rejected, deactivated, or deleted)
    const activeOrPending = and(
      eq(users.isActive, true),
      ne(users.status, 'rejected'),
      isNull(users.deletedAt),
    );
    const whereClause = branchId
      ? and(activeOrPending, eq(users.branchId, branchId))
      : activeOrPending;
    return this.drizzle.db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(asc(users.createdAt));
  }

  async approve(id: string, performedBy?: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (user.status === 'active') throw new BadRequestException('User is already active');

    const [updated] = await this.drizzle.db
      .update(users)
      .set({ status: 'active' })
      .where(eq(users.id, id))
      .returning();

    await this.audit.log({
      action: `Approved user: ${user.email}`,
      auditType: AUDIT_TYPE.USER_STATUS_CHANGED,
      entityType: 'user',
      entityId: id,
      source: 'admin',
      performedBy,
      branchId: user.branchId ?? undefined,
      details: { email: user.email },
    });

    return updated;
  }

  async reject(id: string, performedBy?: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    // Soft-delete instead of hard-delete
    const [updated] = await this.drizzle.db
      .update(users)
      .set({ status: 'rejected', isActive: false, deletedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    await this.audit.log({
      action: `Rejected user: ${user.email}`,
      auditType: AUDIT_TYPE.USER_STATUS_CHANGED,
      entityType: 'user',
      entityId: id,
      source: 'admin',
      performedBy,
      branchId: user.branchId ?? undefined,
      details: { email: user.email },
    });

    return { deleted: true };
  }

  // Returns active users for assignment dropdowns
  // Filtered to the same branch if branchId is provided
  async findAssignable(branchId?: string | null) {
    const baseCondition = and(eq(users.isActive, true), isNull(users.deletedAt));
    const whereClause = branchId
      ? and(baseCondition, eq(users.branchId, branchId))
      : baseCondition;
    return this.drizzle.db
      .select({
        id: users.id,
        nickname: users.nickname,
        fullName: users.fullName,
        email: users.email,
        userType: users.userType,
        branchId: users.branchId,
      })
      .from(users)
      .where(whereClause)
      .orderBy(asc(users.nickname));
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
      auditType: AUDIT_TYPE.USER_STATUS_CHANGED,
      entityType: 'user',
      entityId: id,
      source: 'admin',
      performedBy,
      branchId: user.branchId ?? undefined,
      details: { email: user.email },
    });
  }

  async softDelete(id: string, performedBy?: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const [deleted] = await this.drizzle.db
      .update(users)
      .set({ isActive: false, deletedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    await this.audit.log({
      action: `Deleted user: ${user.email}`,
      auditType: AUDIT_TYPE.USER_DELETED,
      entityType: 'user',
      entityId: id,
      source: 'admin',
      performedBy,
      branchId: user.branchId ?? undefined,
      details: { email: user.email },
    });

    return deleted;
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
      auditType: AUDIT_TYPE.USER_STATUS_CHANGED,
      entityType: 'user',
      entityId: id,
      source: 'admin',
      performedBy,
      branchId: user.branchId ?? undefined,
      details: { email: user.email, prevRole: user.userType, newRole: userType },
    });

    return updated;
  }

  async updateProfile(id: string, dto: UpdateUserProfileDto, performedBy?: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const [updated] = await this.drizzle.db
      .update(users)
      .set(dto)
      .where(eq(users.id, id))
      .returning();

    await this.audit.log({
      action: `Updated profile: ${user.email}`,
      auditType: AUDIT_TYPE.USER_STATUS_CHANGED,
      entityType: 'user',
      entityId: id,
      source: 'admin',
      performedBy,
      branchId: user.branchId ?? undefined,
    });

    return updated;
  }

  async updateBranch(id: string, branchId: string, performedBy?: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const [updated] = await this.drizzle.db
      .update(users)
      .set({ branchId })
      .where(eq(users.id, id))
      .returning();

    await this.audit.log({
      action: `Updated user branch: ${user.email} → branch ${branchId}`,
      auditType: AUDIT_TYPE.USER_STATUS_CHANGED,
      entityType: 'user',
      entityId: id,
      source: 'admin',
      performedBy,
      branchId,
      details: { email: user.email, prevBranchId: user.branchId, newBranchId: branchId },
    });

    return updated;
  }

  async syncUser(data: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
  }): Promise<{
    id: string;
    userType: string;
    status: string;
    branchId: string | null;
    fullName: string | null;
    nickname: string | null;
  }> {
    // Find existing user
    const [existing] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.id, data.id));

    if (existing) {
      return {
        id: existing.id,
        userType: existing.userType,
        status: existing.status,
        branchId: existing.branchId,
        fullName: existing.fullName,
        nickname: existing.nickname,
      };
    }

    // First user ever → auto-superadmin + active (prevents lockout)
    const [{ count: userCount }] = await this.drizzle.db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const isFirstUser = Number(userCount) === 0;

    // Create new user
    const [created] = await this.drizzle.db
      .insert(users)
      .values({
        id: data.id,
        email: data.email,
        fullName: data.name,
        userType: isFirstUser ? 'superadmin' : 'teacher',
        status: isFirstUser ? 'active' : 'pending',
      })
      .returning();

    await this.audit.log({
      action: `New user synced: ${data.email}`,
      auditType: AUDIT_TYPE.USER_CREATED,
      entityType: 'user',
      entityId: created.id,
      source: 'web',
      performedBy: created.id,
      details: { email: data.email, userType: created.userType, status: created.status },
    });

    return {
      id: created.id,
      userType: created.userType,
      status: created.status,
      branchId: created.branchId,
      fullName: created.fullName,
      nickname: created.nickname,
    };
  }
}
