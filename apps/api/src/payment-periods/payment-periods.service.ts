import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  eq,
  and,
  sql,
  getTableColumns,
  asc,
  desc,
  isNull,
} from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service.js';
import { AuditService } from '../audit/audit.service.js';
import { UsersService } from '../users/users.service.js';
import {
  paymentPeriods,
  students,
  payments,
  studentTeacherAssignments,
  users,
} from '../db/schema.js';
import {
  USER_TYPE,
  AUDIT_TYPE,
  PERIOD_STATUS,
  PAYMENT_STATUS,
  toScaled,
  fromScaled,
} from '../db/constants.js';
import type { CreatePeriodDto } from './dto/create-period.dto.js';
import type { UpdatePeriodDto } from './dto/update-period.dto.js';
import type { BulkGeneratePeriodsDto } from './dto/bulk-generate-periods.dto.js';
import type { QueryPeriodsDto } from './dto/query-periods.dto.js';

@Injectable()
export class PaymentPeriodsService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly audit: AuditService,
    private readonly usersService: UsersService,
  ) {}

  // -----------------------------------------------------------------------
  // findAll
  // -----------------------------------------------------------------------
  async findAll(query: QueryPeriodsDto, requestingUserId: string) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    const conditions: ReturnType<typeof eq>[] = [];

    // Soft-delete filters
    conditions.push(isNull(paymentPeriods.deletedAt));
    conditions.push(isNull(students.deletedAt));

    // Branch scoping
    if (user.userType === USER_TYPE.SUPERADMIN) {
      if (query.branchId) {
        conditions.push(eq(students.branchId, query.branchId));
      }
    } else {
      if (!user.branchId) return [];
      conditions.push(eq(students.branchId, user.branchId));
    }

    if (query.studentId) {
      conditions.push(eq(paymentPeriods.studentId, query.studentId));
    }
    if (query.periodMonth) {
      conditions.push(eq(paymentPeriods.periodMonth, query.periodMonth));
    }
    if (query.periodYear) {
      conditions.push(eq(paymentPeriods.periodYear, query.periodYear));
    }
    if (query.status) {
      conditions.push(eq(paymentPeriods.status, query.status));
    }

    const rows = await this.drizzle.db
      .select({
        ...getTableColumns(paymentPeriods),
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        teacherId: studentTeacherAssignments.teacherId,
        teacherName: users.fullName,
      })
      .from(paymentPeriods)
      .innerJoin(students, eq(paymentPeriods.studentId, students.id))
      .leftJoin(
        studentTeacherAssignments,
        and(
          eq(studentTeacherAssignments.studentId, students.id),
          eq(studentTeacherAssignments.isActive, true),
        ),
      )
      .leftJoin(users, eq(studentTeacherAssignments.teacherId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(paymentPeriods.periodYear), desc(paymentPeriods.periodMonth), asc(students.firstName));

    return rows.map((r) => ({
      ...r,
      expectedAmount: fromScaled(Number(r.expectedAmount)),
      paidAmount: fromScaled(Number(r.paidAmount)),
    }));
  }

  // -----------------------------------------------------------------------
  // findOne
  // -----------------------------------------------------------------------
  async findOne(id: string, requestingUserId: string) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    const [period] = await this.drizzle.db
      .select({
        ...getTableColumns(paymentPeriods),
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentBranchId: students.branchId,
      })
      .from(paymentPeriods)
      .innerJoin(students, eq(paymentPeriods.studentId, students.id))
      .where(and(eq(paymentPeriods.id, id), isNull(paymentPeriods.deletedAt)));

    if (!period) throw new NotFoundException('Payment period not found');

    // Branch scoping
    if (user.userType !== USER_TYPE.SUPERADMIN) {
      if (period.studentBranchId !== user.branchId) {
        throw new ForbiddenException('Access denied to this payment period');
      }
    }

    // Fetch payments for this period (exclude soft-deleted)
    const periodPayments = await this.drizzle.db
      .select()
      .from(payments)
      .where(and(eq(payments.periodId, id), isNull(payments.deletedAt)))
      .orderBy(desc(payments.createdAt));

    return {
      ...period,
      expectedAmount: fromScaled(Number(period.expectedAmount)),
      paidAmount: fromScaled(Number(period.paidAmount)),
      payments: periodPayments.map((p) => ({
        ...p,
        amount: fromScaled(Number(p.amount)),
        expectedAmountSnapshot: fromScaled(Number(p.expectedAmountSnapshot)),
      })),
    };
  }

  // -----------------------------------------------------------------------
  // create
  // -----------------------------------------------------------------------
  async create(dto: CreatePeriodDto, requestingUserId: string) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    if (user.userType === USER_TYPE.TEACHER) {
      throw new ForbiddenException('Only admin/superadmin can create payment periods');
    }

    // Validate student exists and is active
    const [student] = await this.drizzle.db
      .select()
      .from(students)
      .where(and(eq(students.id, dto.studentId), isNull(students.deletedAt)));

    if (!student) throw new NotFoundException('Student not found');
    if (student.status !== 'active') {
      throw new ForbiddenException('Cannot create period for inactive student');
    }

    // Branch scoping
    if (user.userType !== USER_TYPE.SUPERADMIN) {
      if (student.branchId !== user.branchId) {
        throw new ForbiddenException('Access denied to this student');
      }
    }

    const scaledAmount = toScaled(dto.expectedAmount);

    try {
      const [created] = await this.drizzle.db
        .insert(paymentPeriods)
        .values({
          studentId: dto.studentId,
          periodMonth: dto.periodMonth,
          periodYear: dto.periodYear,
          expectedAmount: scaledAmount,
          dueDate: dto.dueDate,
          status: PERIOD_STATUS.PENDING,
        })
        .returning();

      await this.audit.log({
        action: `Created payment period: ${student.firstName} ${student.lastName} — ${dto.periodMonth}/${dto.periodYear}`,
        auditType: AUDIT_TYPE.PERIOD_CREATED,
        entityType: 'payment_period',
        entityId: created.id,
        source: 'web',
        performedBy: requestingUserId,
        branchId: student.branchId,
        details: {
          studentId: dto.studentId,
          periodMonth: dto.periodMonth,
          periodYear: dto.periodYear,
          expectedAmount: dto.expectedAmount,
          dueDate: dto.dueDate,
        },
      });

      return {
        ...created,
        expectedAmount: fromScaled(Number(created.expectedAmount)),
        paidAmount: fromScaled(Number(created.paidAmount)),
      };
    } catch (error: any) {
      // Unique constraint violation on (studentId, periodMonth, periodYear)
      if (error?.code === '23505') {
        throw new ConflictException(
          `Payment period already exists for this student in ${dto.periodMonth}/${dto.periodYear}`,
        );
      }
      throw error;
    }
  }

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------
  async update(id: string, dto: UpdatePeriodDto, requestingUserId: string) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    if (user.userType === USER_TYPE.TEACHER) {
      throw new ForbiddenException('Only admin/superadmin can update payment periods');
    }

    const [existing] = await this.drizzle.db
      .select({
        ...getTableColumns(paymentPeriods),
        studentBranchId: students.branchId,
      })
      .from(paymentPeriods)
      .innerJoin(students, eq(paymentPeriods.studentId, students.id))
      .where(and(eq(paymentPeriods.id, id), isNull(paymentPeriods.deletedAt)));

    if (!existing) throw new NotFoundException('Payment period not found');

    if (user.userType !== USER_TYPE.SUPERADMIN) {
      if (existing.studentBranchId !== user.branchId) {
        throw new ForbiddenException('Access denied to this payment period');
      }
    }

    const updates: Record<string, any> = { updatedAt: new Date() };
    const auditDetails: Record<string, any> = {};

    if (dto.expectedAmount !== undefined) {
      auditDetails.oldExpectedAmount = fromScaled(Number(existing.expectedAmount));
      auditDetails.newExpectedAmount = dto.expectedAmount;
      updates.expectedAmount = toScaled(dto.expectedAmount);
    }

    if (dto.dueDate !== undefined) {
      auditDetails.oldDueDate = existing.dueDate;
      auditDetails.newDueDate = dto.dueDate;
      updates.dueDate = dto.dueDate;
    }

    const [updated] = await this.drizzle.db
      .update(paymentPeriods)
      .set(updates)
      .where(eq(paymentPeriods.id, id))
      .returning();

    await this.audit.log({
      action: `Adjusted payment period ${id}`,
      auditType: AUDIT_TYPE.PERIOD_ADJUSTED,
      entityType: 'payment_period',
      entityId: id,
      source: 'web',
      performedBy: requestingUserId,
      branchId: existing.studentBranchId,
      details: auditDetails,
    });

    return {
      ...updated,
      expectedAmount: fromScaled(Number(updated.expectedAmount)),
      paidAmount: fromScaled(Number(updated.paidAmount)),
    };
  }

  // -----------------------------------------------------------------------
  // bulkGenerate
  // -----------------------------------------------------------------------
  async bulkGenerate(dto: BulkGeneratePeriodsDto, requestingUserId: string) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    if (user.userType === USER_TYPE.TEACHER) {
      throw new ForbiddenException('Only admin/superadmin can bulk-generate periods');
    }

    // Determine branch
    let branchId: string;
    if (user.userType === USER_TYPE.SUPERADMIN && dto.branchId) {
      branchId = dto.branchId;
    } else if (user.branchId) {
      branchId = user.branchId;
    } else {
      throw new ForbiddenException('No branch assigned — cannot generate periods');
    }

    // Find all active, non-deleted students in the branch
    const activeStudents = await this.drizzle.db
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.branchId, branchId), eq(students.status, 'active'), isNull(students.deletedAt)));

    if (activeStudents.length === 0) {
      return { created: 0, skipped: 0 };
    }

    // Check which students already have a period for this month/year
    const existingPeriods = await this.drizzle.db
      .select({ studentId: paymentPeriods.studentId })
      .from(paymentPeriods)
      .where(
        and(
          eq(paymentPeriods.periodMonth, dto.periodMonth),
          eq(paymentPeriods.periodYear, dto.periodYear),
        ),
      );

    const existingStudentIds = new Set(existingPeriods.map((p) => p.studentId));
    const toCreate = activeStudents.filter((s) => !existingStudentIds.has(s.id));

    if (toCreate.length === 0) {
      return { created: 0, skipped: activeStudents.length };
    }

    const scaledAmount = toScaled(dto.expectedAmount);

    await this.drizzle.db.insert(paymentPeriods).values(
      toCreate.map((s) => ({
        studentId: s.id,
        periodMonth: dto.periodMonth,
        periodYear: dto.periodYear,
        expectedAmount: scaledAmount,
        dueDate: dto.dueDate,
        status: PERIOD_STATUS.PENDING,
      })),
    );

    await this.audit.log({
      action: `Bulk-generated ${toCreate.length} periods for ${dto.periodMonth}/${dto.periodYear}`,
      auditType: AUDIT_TYPE.PERIOD_BULK_GENERATED,
      entityType: 'payment_period',
      entityId: branchId,
      source: 'web',
      performedBy: requestingUserId,
      branchId,
      details: { created: toCreate.length, skipped: activeStudents.length - toCreate.length, periodMonth: dto.periodMonth, periodYear: dto.periodYear },
    });

    return {
      created: toCreate.length,
      skipped: activeStudents.length - toCreate.length,
    };
  }

  // -----------------------------------------------------------------------
  // softDelete
  // -----------------------------------------------------------------------
  async softDelete(id: string, requestingUserId: string) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    if (user.userType === USER_TYPE.TEACHER) {
      throw new ForbiddenException('Only admin/superadmin can delete payment periods');
    }

    const [existing] = await this.drizzle.db
      .select({
        ...getTableColumns(paymentPeriods),
        studentBranchId: students.branchId,
      })
      .from(paymentPeriods)
      .innerJoin(students, eq(paymentPeriods.studentId, students.id))
      .where(and(eq(paymentPeriods.id, id), isNull(paymentPeriods.deletedAt)));

    if (!existing) throw new NotFoundException('Payment period not found');

    if (user.userType !== USER_TYPE.SUPERADMIN) {
      if (existing.studentBranchId !== user.branchId) {
        throw new ForbiddenException('Access denied to this payment period');
      }
    }

    const [deleted] = await this.drizzle.db
      .update(paymentPeriods)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(paymentPeriods.id, id))
      .returning();

    await this.audit.log({
      action: `Deleted payment period ${id}`,
      auditType: AUDIT_TYPE.PERIOD_DELETED,
      entityType: 'payment_period',
      entityId: id,
      source: 'web',
      performedBy: requestingUserId,
      branchId: existing.studentBranchId,
      details: { periodMonth: existing.periodMonth, periodYear: existing.periodYear, studentId: existing.studentId },
    });

    return deleted;
  }

  // -----------------------------------------------------------------------
  // computeAndUpdatePeriodStatus — called by PaymentsService after verify/reject
  // -----------------------------------------------------------------------
  async computeAndUpdatePeriodStatus(periodId: string): Promise<void> {
    // Sum all verified, non-deleted payments for this period
    const [{ total }] = await this.drizzle.db
      .select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
      .from(payments)
      .where(
        and(
          eq(payments.periodId, periodId),
          eq(payments.status, PAYMENT_STATUS.VERIFIED),
          isNull(payments.deletedAt),
        ),
      );

    // Get the period
    const [period] = await this.drizzle.db
      .select()
      .from(paymentPeriods)
      .where(eq(paymentPeriods.id, periodId));

    if (!period) return;

    const paidAmount = Number(total);

    let status: string;
    const today = new Date();
    const due = new Date(period.dueDate);

    if (paidAmount >= Number(period.expectedAmount)) {
      status = PERIOD_STATUS.PAID;
    } else if (paidAmount > 0) {
      status = today > due ? PERIOD_STATUS.OVERDUE : PERIOD_STATUS.PARTIAL;
    } else {
      status = today > due ? PERIOD_STATUS.OVERDUE : PERIOD_STATUS.PENDING;
    }

    await this.drizzle.db
      .update(paymentPeriods)
      .set({ paidAmount, status, updatedAt: new Date() })
      .where(eq(paymentPeriods.id, periodId));
  }
}
