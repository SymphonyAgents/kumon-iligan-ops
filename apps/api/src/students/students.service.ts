import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  eq,
  and,
  or,
  ilike,
  getTableColumns,
  asc,
  desc,
  inArray,
  isNull,
} from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service.js';
import { AuditService } from '../audit/audit.service.js';
import { UsersService } from '../users/users.service.js';
import {
  students,
  families,
  studentTeacherAssignments,
  users,
  paymentPeriods,
} from '../db/schema.js';
import { USER_TYPE, AUDIT_TYPE, fromScaled } from '../db/constants.js';
import type { CreateStudentDto } from './dto/create-student.dto.js';
import type { UpdateStudentDto } from './dto/update-student.dto.js';
import type { ChangeStudentStatusDto } from './dto/change-student-status.dto.js';
import type { AssignTeacherDto } from './dto/assign-teacher.dto.js';
import type { QueryStudentsDto } from './dto/query-students.dto.js';

@Injectable()
export class StudentsService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly audit: AuditService,
    private readonly usersService: UsersService,
  ) {}

  private async attachCurrentPeriods<T extends { id: string }>(rows: T[]): Promise<Array<T & { currentPeriod: any }>> {
    if (rows.length === 0) return rows.map((r) => ({ ...r, currentPeriod: null }));
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const ids = rows.map((r) => r.id);
    const periodRows = await this.drizzle.db
      .select()
      .from(paymentPeriods)
      .where(
        and(
          inArray(paymentPeriods.studentId, ids),
          eq(paymentPeriods.periodMonth, month),
          eq(paymentPeriods.periodYear, year),
          isNull(paymentPeriods.deletedAt),
        ),
      );
    const byStudent = new Map<string, (typeof periodRows)[number]>();
    for (const p of periodRows) byStudent.set(p.studentId, p);
    return rows.map((r) => {
      const p = byStudent.get(r.id) ?? null;
      return {
        ...r,
        currentPeriod: p
          ? {
              ...p,
              expectedAmount: fromScaled(Number(p.expectedAmount)),
              paidAmount: fromScaled(Number(p.paidAmount)),
            }
          : null,
      };
    });
  }

  async findAll(query: QueryStudentsDto, requestingUserId: string) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    // For teachers: only students assigned to them with isActive assignment
    if (user.userType === USER_TYPE.TEACHER) {
      const assignments = await this.drizzle.db
        .select({ studentId: studentTeacherAssignments.studentId })
        .from(studentTeacherAssignments)
        .where(
          and(
            eq(studentTeacherAssignments.teacherId, requestingUserId),
            eq(studentTeacherAssignments.isActive, true),
          ),
        );

      if (assignments.length === 0) return [];

      const studentIds = assignments.map((a) => a.studentId);

      const conditions: ReturnType<typeof eq>[] = [
        inArray(students.id, studentIds),
        isNull(students.deletedAt),
      ];

      if (query.status) {
        conditions.push(eq(students.status, query.status));
      }
      if (query.search) {
        const pattern = `%${query.search}%`;
        conditions.push(
          or(
            ilike(students.firstName, pattern),
            ilike(students.lastName, pattern),
          ) as ReturnType<typeof eq>,
        );
      }

      const teacherRows = await this.drizzle.db
        .select({
          ...getTableColumns(students),
          guardianName: families.guardianName,
          guardianPhone: families.guardianPhone,
          teacherId: studentTeacherAssignments.teacherId,
          teacherName: users.fullName,
        })
        .from(students)
        .leftJoin(families, eq(students.familyId, families.id))
        .leftJoin(
          studentTeacherAssignments,
          and(
            eq(studentTeacherAssignments.studentId, students.id),
            eq(studentTeacherAssignments.isActive, true),
          ),
        )
        .leftJoin(users, eq(studentTeacherAssignments.teacherId, users.id))
        .where(and(...conditions))
        .orderBy(asc(students.firstName));
      return this.attachCurrentPeriods(teacherRows);
    }

    // Admin / Superadmin
    const conditions: ReturnType<typeof eq>[] = [];

    // Soft-delete filter
    conditions.push(isNull(students.deletedAt));

    if (user.userType === USER_TYPE.SUPERADMIN) {
      if (query.branchId) {
        conditions.push(eq(students.branchId, query.branchId));
      }
    } else {
      // Admin sees own branch only
      if (!user.branchId) return [];
      conditions.push(eq(students.branchId, user.branchId));
    }

    if (query.teacherId) {
      // Filter by teacher assignment
      const assignments = await this.drizzle.db
        .select({ studentId: studentTeacherAssignments.studentId })
        .from(studentTeacherAssignments)
        .where(
          and(
            eq(studentTeacherAssignments.teacherId, query.teacherId),
            eq(studentTeacherAssignments.isActive, true),
          ),
        );
      if (assignments.length === 0) return [];
      conditions.push(inArray(students.id, assignments.map((a) => a.studentId)));
    }

    if (query.status) {
      conditions.push(eq(students.status, query.status));
    }

    if (query.search) {
      const pattern = `%${query.search}%`;
      conditions.push(
        or(
          ilike(students.firstName, pattern),
          ilike(students.lastName, pattern),
        ) as ReturnType<typeof eq>,
      );
    }

    const adminRows = await this.drizzle.db
      .select({
        ...getTableColumns(students),
        guardianName: families.guardianName,
        guardianPhone: families.guardianPhone,
        teacherId: studentTeacherAssignments.teacherId,
        teacherName: users.fullName,
      })
      .from(students)
      .leftJoin(families, eq(students.familyId, families.id))
      .leftJoin(
        studentTeacherAssignments,
        and(
          eq(studentTeacherAssignments.studentId, students.id),
          eq(studentTeacherAssignments.isActive, true),
        ),
      )
      .leftJoin(users, eq(studentTeacherAssignments.teacherId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(students.firstName));
    return this.attachCurrentPeriods(adminRows);
  }

  async findOne(id: string, requestingUserId: string) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    const [student] = await this.drizzle.db
      .select()
      .from(students)
      .where(and(eq(students.id, id), isNull(students.deletedAt)));

    if (!student) throw new NotFoundException('Student not found');

    // Branch scoping
    if (user.userType !== USER_TYPE.SUPERADMIN) {
      if (student.branchId !== user.branchId) {
        throw new ForbiddenException('Access denied to this student');
      }
    }

    // Family
    const [family] = await this.drizzle.db
      .select()
      .from(families)
      .where(eq(families.id, student.familyId));

    // Current active assignment
    const [activeAssignment] = await this.drizzle.db
      .select({
        id: studentTeacherAssignments.id,
        teacherId: studentTeacherAssignments.teacherId,
        teacherName: users.fullName,
        teacherEmail: users.email,
        assignedAt: studentTeacherAssignments.assignedAt,
      })
      .from(studentTeacherAssignments)
      .leftJoin(users, eq(studentTeacherAssignments.teacherId, users.id))
      .where(
        and(
          eq(studentTeacherAssignments.studentId, id),
          eq(studentTeacherAssignments.isActive, true),
        ),
      );

    // Current month's payment period
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const [activePeriod] = await this.drizzle.db
      .select()
      .from(paymentPeriods)
      .where(
        and(
          eq(paymentPeriods.studentId, id),
          eq(paymentPeriods.periodMonth, currentMonth),
          eq(paymentPeriods.periodYear, currentYear),
        ),
      );

    return {
      ...student,
      family: family ?? null,
      currentAssignment: activeAssignment ?? null,
      currentPeriod: activePeriod
        ? {
            ...activePeriod,
            expectedAmount: fromScaled(Number(activePeriod.expectedAmount)),
            paidAmount: fromScaled(Number(activePeriod.paidAmount)),
          }
        : null,
    };
  }

  async enroll(dto: CreateStudentDto, requestingUserId: string) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    if (user.userType === USER_TYPE.TEACHER) {
      throw new ForbiddenException('Teachers cannot enroll students');
    }

    // Validate family exists
    const [family] = await this.drizzle.db
      .select()
      .from(families)
      .where(eq(families.id, dto.familyId));

    if (!family) throw new NotFoundException('Family not found');

    // Determine branchId
    let branchId: string;
    if (user.userType === USER_TYPE.SUPERADMIN && dto.branchId) {
      branchId = dto.branchId;
    } else if (user.branchId) {
      branchId = user.branchId;
    } else {
      throw new ForbiddenException('No branch assigned — cannot enroll student');
    }

    const [created] = await this.drizzle.db
      .insert(students)
      .values({
        familyId: dto.familyId,
        branchId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        level: dto.level ?? null,
        enrollmentDate: dto.enrollmentDate,
        status: 'active',
      })
      .returning();

    await this.audit.log({
      action: `Enrolled student: ${dto.firstName} ${dto.lastName}`,
      auditType: AUDIT_TYPE.STUDENT_ENROLLED,
      entityType: 'student',
      entityId: created.id,
      source: 'web',
      performedBy: requestingUserId,
      branchId,
      details: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        familyId: dto.familyId,
        level: dto.level,
      },
    });

    return created;
  }

  async update(id: string, dto: UpdateStudentDto, requestingUserId: string) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    if (user.userType === USER_TYPE.TEACHER) {
      throw new ForbiddenException('Teachers cannot update students');
    }

    const [existing] = await this.drizzle.db
      .select()
      .from(students)
      .where(and(eq(students.id, id), isNull(students.deletedAt)));

    if (!existing) throw new NotFoundException('Student not found');

    if (user.userType !== USER_TYPE.SUPERADMIN) {
      if (existing.branchId !== user.branchId) {
        throw new ForbiddenException('Access denied to this student');
      }
    }

    const [updated] = await this.drizzle.db
      .update(students)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();

    await this.audit.log({
      action: `Updated student: ${existing.firstName} ${existing.lastName}`,
      auditType: AUDIT_TYPE.STUDENT_UPDATED,
      entityType: 'student',
      entityId: id,
      source: 'web',
      performedBy: requestingUserId,
      branchId: existing.branchId,
      details: { changes: dto },
    });

    return updated;
  }

  async changeStatus(
    id: string,
    dto: ChangeStudentStatusDto,
    requestingUserId: string,
  ) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    if (user.userType === USER_TYPE.TEACHER) {
      throw new ForbiddenException('Teachers cannot change student status');
    }

    const [existing] = await this.drizzle.db
      .select()
      .from(students)
      .where(and(eq(students.id, id), isNull(students.deletedAt)));

    if (!existing) throw new NotFoundException('Student not found');

    if (user.userType !== USER_TYPE.SUPERADMIN) {
      if (existing.branchId !== user.branchId) {
        throw new ForbiddenException('Access denied to this student');
      }
    }

    const [updated] = await this.drizzle.db
      .update(students)
      .set({ status: dto.status, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();

    await this.audit.log({
      action: `Changed student status: ${existing.firstName} ${existing.lastName} → ${dto.status}`,
      auditType: AUDIT_TYPE.STUDENT_STATUS_CHANGED,
      entityType: 'student',
      entityId: id,
      source: 'web',
      performedBy: requestingUserId,
      branchId: existing.branchId,
      details: {
        previousStatus: existing.status,
        newStatus: dto.status,
        reason: dto.reason,
      },
    });

    return updated;
  }

  async assignTeacher(
    studentId: string,
    dto: AssignTeacherDto,
    requestingUserId: string,
  ) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    if (user.userType === USER_TYPE.TEACHER) {
      throw new ForbiddenException('Teachers cannot reassign students');
    }

    const [student] = await this.drizzle.db
      .select()
      .from(students)
      .where(and(eq(students.id, studentId), isNull(students.deletedAt)));

    if (!student) throw new NotFoundException('Student not found');

    if (user.userType !== USER_TYPE.SUPERADMIN) {
      if (student.branchId !== user.branchId) {
        throw new ForbiddenException('Access denied to this student');
      }
    }

    // Validate teacher exists and is active
    const teacher = await this.usersService.findByIdFull(dto.teacherId);
    if (!teacher) throw new NotFoundException('Teacher not found');
    if (teacher.userType !== USER_TYPE.TEACHER) {
      throw new BadRequestException('Target user is not a teacher');
    }

    // Deactivate current active assignment (if any)
    const [currentAssignment] = await this.drizzle.db
      .select()
      .from(studentTeacherAssignments)
      .where(
        and(
          eq(studentTeacherAssignments.studentId, studentId),
          eq(studentTeacherAssignments.isActive, true),
        ),
      );

    if (currentAssignment) {
      await this.drizzle.db
        .update(studentTeacherAssignments)
        .set({ isActive: false, unassignedAt: new Date() })
        .where(eq(studentTeacherAssignments.id, currentAssignment.id));
    }

    // Create new assignment
    const [newAssignment] = await this.drizzle.db
      .insert(studentTeacherAssignments)
      .values({
        studentId,
        teacherId: dto.teacherId,
        branchId: student.branchId,
        isActive: true,
      })
      .returning();

    await this.audit.log({
      action: `Assigned teacher to student: ${student.firstName} ${student.lastName}`,
      auditType: AUDIT_TYPE.STUDENT_REASSIGNED,
      entityType: 'student',
      entityId: studentId,
      source: 'web',
      performedBy: requestingUserId,
      branchId: student.branchId,
      details: {
        previousTeacherId: currentAssignment?.teacherId ?? null,
        newTeacherId: dto.teacherId,
      },
    });

    return newAssignment;
  }

  async softDelete(id: string, requestingUserId: string) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    if (user.userType === USER_TYPE.TEACHER) {
      throw new ForbiddenException('Teachers cannot delete students');
    }

    const [existing] = await this.drizzle.db
      .select()
      .from(students)
      .where(and(eq(students.id, id), isNull(students.deletedAt)));

    if (!existing) throw new NotFoundException('Student not found');

    if (user.userType !== USER_TYPE.SUPERADMIN) {
      if (existing.branchId !== user.branchId) {
        throw new ForbiddenException('Access denied to this student');
      }
    }

    const [deleted] = await this.drizzle.db
      .update(students)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();

    await this.audit.log({
      action: `Deleted student: ${existing.firstName} ${existing.lastName}`,
      auditType: AUDIT_TYPE.STUDENT_DELETED,
      entityType: 'student',
      entityId: id,
      source: 'web',
      performedBy: requestingUserId,
      branchId: existing.branchId,
      details: { firstName: existing.firstName, lastName: existing.lastName },
    });

    return deleted;
  }
}
