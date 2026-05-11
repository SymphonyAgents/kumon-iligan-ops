import {
 Injectable,
 NotFoundException,
 BadRequestException,
 ForbiddenException,
 UnauthorizedException,
} from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service.js';
import { AuditService } from '../audit/audit.service.js';
import { UsersService } from '../users/users.service.js';
import { families, familyMembers } from '../db/schema.js';
import { USER_TYPE, AUDIT_TYPE } from '../db/constants.js';
import type { CreateFamilyMemberDto } from './dto/create-family-member.dto.js';
import type { UpdateFamilyMemberDto } from './dto/update-family-member.dto.js';

@Injectable()
export class FamilyMembersService {
 constructor(
 private readonly drizzle: DrizzleService,
 private readonly audit: AuditService,
 private readonly usersService: UsersService,
 ) {}

 private async loadFamilyOrThrow(familyId: string, requestingUserId: string) {
 const user = await this.usersService.findByIdFull(requestingUserId);
 if (!user) throw new UnauthorizedException();

 const [family] = await this.drizzle.db
 .select()
 .from(families)
 .where(and(eq(families.id, familyId), isNull(families.deletedAt)));
 if (!family) throw new NotFoundException('Family not found');

 if (user.userType !== USER_TYPE.SUPERADMIN) {
 if (family.branchId !== user.branchId) {
 throw new ForbiddenException('Access denied to this family');
 }
 }
 return { user, family };
 }

 async listByFamily(familyId: string, requestingUserId: string) {
 await this.loadFamilyOrThrow(familyId, requestingUserId);
 return this.drizzle.db
 .select()
 .from(familyMembers)
 .where(and(eq(familyMembers.familyId, familyId), isNull(familyMembers.deletedAt)))
 .orderBy(asc(familyMembers.fullName));
 }

 async create(familyId: string, dto: CreateFamilyMemberDto, requestingUserId: string) {
 const { family } = await this.loadFamilyOrThrow(familyId, requestingUserId);

 // If this row will be primary, clear any existing primary first.
 if (dto.isPrimary) {
 await this.drizzle.db
 .update(familyMembers)
 .set({ isPrimary: false, updatedAt: new Date() })
 .where(and(eq(familyMembers.familyId, familyId), eq(familyMembers.isPrimary, true)));
 }

 const [created] = await this.drizzle.db
 .insert(familyMembers)
 .values({
 familyId,
 fullName: dto.fullName.trim(),
 phone: dto.phone?.trim() || null,
 email: dto.email?.trim() || null,
 relation: dto.relation,
 isPrimary: !!dto.isPrimary,
 })
 .returning();

 if (created.isPrimary) {
 await this.syncFamilyPrimary(familyId);
 }

 await this.audit.log({
 action: `Added family member: ${created.fullName}`,
 auditType: AUDIT_TYPE.FAMILY_UPDATED,
 entityType: 'family',
 entityId: familyId,
 source: 'web',
 performedBy: requestingUserId,
 branchId: family.branchId,
 details: { memberId: created.id, relation: created.relation, isPrimary: created.isPrimary },
 });

 return created;
 }

 async update(familyId: string, memberId: string, dto: UpdateFamilyMemberDto, requestingUserId: string) {
 const { family } = await this.loadFamilyOrThrow(familyId, requestingUserId);

 const [existing] = await this.drizzle.db
 .select()
 .from(familyMembers)
 .where(and(eq(familyMembers.id, memberId), eq(familyMembers.familyId, familyId), isNull(familyMembers.deletedAt)));
 if (!existing) throw new NotFoundException('Member not found');

 if (dto.isPrimary === true && !existing.isPrimary) {
 await this.drizzle.db
 .update(familyMembers)
 .set({ isPrimary: false, updatedAt: new Date() })
 .where(and(eq(familyMembers.familyId, familyId), eq(familyMembers.isPrimary, true)));
 }

 const updates: Partial<typeof familyMembers.$inferInsert> = { updatedAt: new Date() };
 if (dto.fullName !== undefined) updates.fullName = dto.fullName.trim();
 if (dto.phone !== undefined) updates.phone = dto.phone?.trim() || null;
 if (dto.email !== undefined) updates.email = dto.email?.trim() || null;
 if (dto.relation !== undefined) updates.relation = dto.relation;
 if (dto.isPrimary !== undefined) updates.isPrimary = dto.isPrimary;

 const [updated] = await this.drizzle.db
 .update(familyMembers)
 .set(updates)
 .where(eq(familyMembers.id, memberId))
 .returning();

 if (updated.isPrimary || existing.isPrimary !== updated.isPrimary) {
 await this.syncFamilyPrimary(familyId);
 }

 await this.audit.log({
 action: `Updated family member: ${updated.fullName}`,
 auditType: AUDIT_TYPE.FAMILY_UPDATED,
 entityType: 'family',
 entityId: familyId,
 source: 'web',
 performedBy: requestingUserId,
 branchId: family.branchId,
 details: { memberId: updated.id, before: existing, after: updated },
 });

 return updated;
 }

 async remove(familyId: string, memberId: string, requestingUserId: string) {
 const { family } = await this.loadFamilyOrThrow(familyId, requestingUserId);

 const [existing] = await this.drizzle.db
 .select()
 .from(familyMembers)
 .where(and(eq(familyMembers.id, memberId), eq(familyMembers.familyId, familyId), isNull(familyMembers.deletedAt)));
 if (!existing) throw new NotFoundException('Member not found');

 if (existing.isPrimary) {
 throw new BadRequestException(
 'Cannot remove the primary member. Set another member as primary first.',
 );
 }

 await this.drizzle.db
 .update(familyMembers)
 .set({ deletedAt: new Date(), updatedAt: new Date() })
 .where(eq(familyMembers.id, memberId));

 await this.audit.log({
 action: `Removed family member: ${existing.fullName}`,
 auditType: AUDIT_TYPE.FAMILY_UPDATED,
 entityType: 'family',
 entityId: familyId,
 source: 'web',
 performedBy: requestingUserId,
 branchId: family.branchId,
 details: { memberId, relation: existing.relation },
 });

 return { deleted: true };
 }

 // Keep families.guardian_name / guardian_phone / guardian_email in sync with whichever
 // member is currently is_primary. Other code reads these legacy columns as a cache.
 private async syncFamilyPrimary(familyId: string) {
 const [primary] = await this.drizzle.db
 .select()
 .from(familyMembers)
 .where(and(eq(familyMembers.familyId, familyId), eq(familyMembers.isPrimary, true), isNull(familyMembers.deletedAt)));
 if (!primary) return;
 await this.drizzle.db
 .update(families)
 .set({
 guardianName: primary.fullName,
 guardianPhone: primary.phone ?? '',
 guardianEmail: primary.email,
 updatedAt: new Date(),
 })
 .where(eq(families.id, familyId));
 }
}
