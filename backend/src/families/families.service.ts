import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { eq, and, or, ilike, getTableColumns, asc } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service.js';
import { AuditService } from '../audit/audit.service.js';
import { UsersService } from '../users/users.service.js';
import { families, students } from '../db/schema.js';
import { USER_TYPE, AUDIT_TYPE } from '../db/constants.js';
import type { CreateFamilyDto } from './dto/create-family.dto.js';
import type { UpdateFamilyDto } from './dto/update-family.dto.js';
import type { QueryFamiliesDto } from './dto/query-families.dto.js';

@Injectable()
export class FamiliesService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly audit: AuditService,
    private readonly usersService: UsersService,
  ) {}

  async findAll(query: QueryFamiliesDto, requestingUserId: string) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    const conditions: ReturnType<typeof eq>[] = [];

    // Branch scoping
    if (user.userType === USER_TYPE.SUPERADMIN) {
      if (query.branchId) {
        conditions.push(eq(families.branchId, query.branchId));
      }
    } else {
      // Admin/teacher only see their own branch
      if (!user.branchId) return [];
      conditions.push(eq(families.branchId, user.branchId));
    }

    // Search by guardianName or guardianPhone
    if (query.search) {
      const pattern = `%${query.search}%`;
      conditions.push(
        or(
          ilike(families.guardianName, pattern),
          ilike(families.guardianPhone, pattern),
        ) as ReturnType<typeof eq>,
      );
    }

    return this.drizzle.db
      .select()
      .from(families)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(families.guardianName));
  }

  async findOne(id: string, requestingUserId: string) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    const [family] = await this.drizzle.db
      .select()
      .from(families)
      .where(eq(families.id, id));

    if (!family) throw new NotFoundException('Family not found');

    // Branch scoping
    if (user.userType !== USER_TYPE.SUPERADMIN) {
      if (family.branchId !== user.branchId) {
        throw new ForbiddenException('Access denied to this family');
      }
    }

    // Include students
    const familyStudents = await this.drizzle.db
      .select()
      .from(students)
      .where(eq(students.familyId, id))
      .orderBy(asc(students.firstName));

    return { ...family, students: familyStudents };
  }

  async create(dto: CreateFamilyDto, requestingUserId: string) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    // Teachers cannot manage families
    if (user.userType === USER_TYPE.TEACHER) {
      throw new ForbiddenException('Teachers cannot create families');
    }

    // Determine branchId: explicit in DTO (for superadmin) or from user's branch
    let branchId: string;
    if (user.userType === USER_TYPE.SUPERADMIN && dto.branchId) {
      branchId = dto.branchId;
    } else if (user.branchId) {
      branchId = user.branchId;
    } else {
      throw new ForbiddenException('No branch assigned — cannot create family');
    }

    const [created] = await this.drizzle.db
      .insert(families)
      .values({
        guardianName: dto.guardianName,
        guardianPhone: dto.guardianPhone,
        guardianEmail: dto.guardianEmail ?? null,
        streetName: dto.streetName ?? null,
        barangay: dto.barangay ?? null,
        city: dto.city ?? null,
        province: dto.province ?? null,
        country: dto.country ?? 'PH',
        notes: dto.notes ?? null,
        branchId,
      })
      .returning();

    await this.audit.log({
      action: `Created family: ${dto.guardianName}`,
      auditType: AUDIT_TYPE.FAMILY_CREATED,
      entityType: 'family',
      entityId: created.id,
      source: 'web',
      performedBy: requestingUserId,
      branchId,
      details: { guardianName: dto.guardianName, guardianPhone: dto.guardianPhone },
    });

    return created;
  }

  async update(id: string, dto: UpdateFamilyDto, requestingUserId: string) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    // Teachers cannot manage families
    if (user.userType === USER_TYPE.TEACHER) {
      throw new ForbiddenException('Teachers cannot update families');
    }

    const [existing] = await this.drizzle.db
      .select()
      .from(families)
      .where(eq(families.id, id));

    if (!existing) throw new NotFoundException('Family not found');

    // Branch ownership validation
    if (user.userType !== USER_TYPE.SUPERADMIN) {
      if (existing.branchId !== user.branchId) {
        throw new ForbiddenException('Access denied to this family');
      }
    }

    const [updated] = await this.drizzle.db
      .update(families)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(families.id, id))
      .returning();

    await this.audit.log({
      action: `Updated family: ${updated.guardianName}`,
      auditType: AUDIT_TYPE.FAMILY_UPDATED,
      entityType: 'family',
      entityId: id,
      source: 'web',
      performedBy: requestingUserId,
      branchId: existing.branchId,
      details: { changes: dto },
    });

    return updated;
  }
}
