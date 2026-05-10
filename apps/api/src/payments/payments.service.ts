import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  eq,
  and,
  desc,
  gte,
  lte,
  getTableColumns,
  sql,
  isNull,
} from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service.js';
import { AuditService } from '../audit/audit.service.js';
import { UsersService } from '../users/users.service.js';
import { PaymentPeriodsService } from '../payment-periods/payment-periods.service.js';
import {
  payments,
  students,
  families,
  paymentPeriods,
  users,
} from '../db/schema.js';
import {
  USER_TYPE,
  AUDIT_TYPE,
  PAYMENT_STATUS,
  toScaled,
  fromScaled,
  formatPaymentNumber,
} from '../db/constants.js';
import type { CreatePaymentDto } from './dto/create-payment.dto.js';
import type { VerifyPaymentDto } from './dto/verify-payment.dto.js';
import type { FlagPaymentDto } from './dto/flag-payment.dto.js';
import type { RejectPaymentDto } from './dto/reject-payment.dto.js';
import type { ReplyPaymentDto } from './dto/reply-payment.dto.js';
import type { QueryPaymentsDto } from './dto/query-payments.dto.js';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly audit: AuditService,
    private readonly usersService: UsersService,
    private readonly paymentPeriodsService: PaymentPeriodsService,
  ) {}

  // -----------------------------------------------------------------------
  // helpers
  // -----------------------------------------------------------------------
  private async generatePaymentNumber(): Promise<string> {
    const result = await this.drizzle.db
      .select({ number: payments.number })
      .from(payments)
      .orderBy(desc(payments.number))
      .limit(1);

    if (result.length === 0) return 'PAY-0001';

    const lastNumber = result[0].number; // e.g. "PAY-0042"
    const seq = parseInt(lastNumber.replace('PAY-', ''), 10);
    return formatPaymentNumber(seq + 1);
  }

  private formatPayment(row: any) {
    return {
      ...row,
      amount: fromScaled(Number(row.amount)),
      expectedAmountSnapshot: fromScaled(Number(row.expectedAmountSnapshot)),
    };
  }

  // -----------------------------------------------------------------------
  // findAll
  // -----------------------------------------------------------------------
  async findAll(query: QueryPaymentsDto, requestingUserId: string) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    const conditions: ReturnType<typeof eq>[] = [];

    // Soft-delete filter
    conditions.push(isNull(payments.deletedAt));

    // Role-based scoping
    if (user.userType === USER_TYPE.TEACHER) {
      // Teachers see only payments they recorded
      conditions.push(eq(payments.recordedBy, requestingUserId));
    } else if (user.userType === USER_TYPE.ADMIN) {
      if (!user.branchId) return [];
      conditions.push(eq(payments.branchId, user.branchId));
    } else {
      // Superadmin — filter by branchId if provided
      if (query.branchId) {
        conditions.push(eq(payments.branchId, query.branchId));
      }
    }

    if (query.teacherId) {
      conditions.push(eq(payments.recordedBy, query.teacherId));
    }
    if (query.status) {
      conditions.push(eq(payments.status, query.status));
    }
    if (query.periodId) {
      conditions.push(eq(payments.periodId, query.periodId));
    }
    if (query.studentId) {
      conditions.push(eq(payments.studentId, query.studentId));
    }
    if (query.familyId) {
      conditions.push(eq(payments.familyId, query.familyId));
    }
    if (query.dateFrom) {
      conditions.push(gte(payments.paymentDate, query.dateFrom) as ReturnType<typeof eq>);
    }
    if (query.dateTo) {
      conditions.push(lte(payments.paymentDate, query.dateTo) as ReturnType<typeof eq>);
    }

    // Alias for the recordedBy user
    const recordedByUser = this.drizzle.db
      .select({
        id: users.id,
        fullName: users.fullName,
      })
      .from(users)
      .as('recorded_by_user');

    const rows = await this.drizzle.db
      .select({
        ...getTableColumns(payments),
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        guardianName: families.guardianName,
        recordedByName: recordedByUser.fullName,
      })
      .from(payments)
      .leftJoin(students, eq(payments.studentId, students.id))
      .leftJoin(families, eq(payments.familyId, families.id))
      .leftJoin(recordedByUser, eq(payments.recordedBy, recordedByUser.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(payments.createdAt));

    return rows.map((r) => this.formatPayment(r));
  }

  // -----------------------------------------------------------------------
  // findOne
  // -----------------------------------------------------------------------
  async findOne(id: string, requestingUserId: string) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    const [payment] = await this.drizzle.db
      .select()
      .from(payments)
      .where(and(eq(payments.id, id), isNull(payments.deletedAt)));

    if (!payment) throw new NotFoundException('Payment not found');

    // Branch scoping
    if (user.userType === USER_TYPE.TEACHER) {
      if (payment.recordedBy !== requestingUserId) {
        throw new ForbiddenException('Access denied to this payment');
      }
    } else if (user.userType === USER_TYPE.ADMIN) {
      if (payment.branchId !== user.branchId) {
        throw new ForbiddenException('Access denied to this payment');
      }
    }

    // Fetch related records
    const [student] = await this.drizzle.db
      .select()
      .from(students)
      .where(eq(students.id, payment.studentId));

    const [family] = await this.drizzle.db
      .select()
      .from(families)
      .where(eq(families.id, payment.familyId));

    const [period] = await this.drizzle.db
      .select()
      .from(paymentPeriods)
      .where(eq(paymentPeriods.id, payment.periodId));

    const [recordedByUserRow] = await this.drizzle.db
      .select({ id: users.id, fullName: users.fullName, email: users.email })
      .from(users)
      .where(eq(users.id, payment.recordedBy));

    let verifiedByUserRow: { id: string; fullName: string | null; email: string } | null = null;
    if (payment.verifiedBy) {
      const [vbu] = await this.drizzle.db
        .select({ id: users.id, fullName: users.fullName, email: users.email })
        .from(users)
        .where(eq(users.id, payment.verifiedBy));
      verifiedByUserRow = vbu ?? null;
    }

    return {
      ...this.formatPayment(payment),
      student: student ?? null,
      family: family ?? null,
      period: period
        ? {
            ...period,
            expectedAmount: fromScaled(Number(period.expectedAmount)),
            paidAmount: fromScaled(Number(period.paidAmount)),
          }
        : null,
      recordedByUser: recordedByUserRow ?? null,
      verifiedByUser: verifiedByUserRow,
    };
  }

  // -----------------------------------------------------------------------
  // record
  // -----------------------------------------------------------------------
  async record(dto: CreatePaymentDto, requestingUserId: string) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    // Validate student exists and is not deleted
    const [student] = await this.drizzle.db
      .select()
      .from(students)
      .where(and(eq(students.id, dto.studentId), isNull(students.deletedAt)));

    if (!student) throw new NotFoundException('Student not found');

    // Branch scoping
    if (user.userType !== USER_TYPE.SUPERADMIN) {
      if (student.branchId !== user.branchId) {
        throw new ForbiddenException('Access denied to this student');
      }
    }

    // Validate period exists and belongs to the student
    const [period] = await this.drizzle.db
      .select()
      .from(paymentPeriods)
      .where(eq(paymentPeriods.id, dto.periodId));

    if (!period) throw new NotFoundException('Payment period not found');
    if (period.studentId !== dto.studentId) {
      throw new BadRequestException('Payment period does not belong to this student');
    }

    // Validate referenceNumber is unique
    const [existingRef] = await this.drizzle.db
      .select({ id: payments.id })
      .from(payments)
      .where(eq(payments.referenceNumber, dto.referenceNumber));

    if (existingRef) {
      throw new ConflictException('A payment with this reference number already exists');
    }

    // Validate paymentDate is not in the future
    const paymentDate = new Date(dto.paymentDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (paymentDate > today) {
      throw new BadRequestException('Payment date cannot be in the future');
    }

    const paymentNumber = await this.generatePaymentNumber();
    const scaledAmount = toScaled(dto.amount);

    const [created] = await this.drizzle.db
      .insert(payments)
      .values({
        number: paymentNumber,
        studentId: dto.studentId,
        familyId: student.familyId,
        periodId: dto.periodId,
        amount: scaledAmount,
        expectedAmountSnapshot: period.expectedAmount,
        paymentMethod: dto.paymentMethod,
        referenceNumber: dto.referenceNumber,
        receiptImageUrl: dto.receiptImageUrl,
        paymentDate: dto.paymentDate,
        status: PAYMENT_STATUS.PENDING_REVIEW,
        note: dto.note ?? null,
        recordedBy: requestingUserId,
        branchId: student.branchId,
      })
      .returning();

    await this.audit.log({
      action: `Recorded payment ${paymentNumber} for ${student.firstName} ${student.lastName}`,
      auditType: AUDIT_TYPE.PAYMENT_RECORDED,
      entityType: 'payment',
      entityId: created.id,
      source: 'web',
      performedBy: requestingUserId,
      branchId: student.branchId,
      details: {
        paymentNumber,
        studentId: dto.studentId,
        periodId: dto.periodId,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        referenceNumber: dto.referenceNumber,
      },
    });

    return this.formatPayment(created);
  }

  // -----------------------------------------------------------------------
  // verify
  // -----------------------------------------------------------------------
  async verify(id: string, dto: VerifyPaymentDto, requestingUserId: string) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    if (user.userType === USER_TYPE.TEACHER) {
      throw new ForbiddenException('Only admin/superadmin can verify payments');
    }

    const [payment] = await this.drizzle.db
      .select()
      .from(payments)
      .where(and(eq(payments.id, id), isNull(payments.deletedAt)));

    if (!payment) throw new NotFoundException('Payment not found');

    if (user.userType !== USER_TYPE.SUPERADMIN) {
      if (payment.branchId !== user.branchId) {
        throw new ForbiddenException('Access denied to this payment');
      }
    }

    const [updated] = await this.drizzle.db
      .update(payments)
      .set({
        status: PAYMENT_STATUS.VERIFIED,
        verifiedBy: requestingUserId,
        verifiedAt: new Date(),
        note: dto.note ?? payment.note,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, id))
      .returning();

    // Recompute period status
    await this.paymentPeriodsService.computeAndUpdatePeriodStatus(payment.periodId);

    await this.audit.log({
      action: `Verified payment ${payment.number}`,
      auditType: AUDIT_TYPE.PAYMENT_VERIFIED,
      entityType: 'payment',
      entityId: id,
      source: 'web',
      performedBy: requestingUserId,
      branchId: payment.branchId,
      details: { paymentNumber: payment.number },
    });

    return this.formatPayment(updated);
  }

  // -----------------------------------------------------------------------
  // flag
  // -----------------------------------------------------------------------
  async flag(id: string, dto: FlagPaymentDto, requestingUserId: string) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    if (user.userType === USER_TYPE.TEACHER) {
      throw new ForbiddenException('Only admin/superadmin can flag payments');
    }

    const [payment] = await this.drizzle.db
      .select()
      .from(payments)
      .where(and(eq(payments.id, id), isNull(payments.deletedAt)));

    if (!payment) throw new NotFoundException('Payment not found');

    if (user.userType !== USER_TYPE.SUPERADMIN) {
      if (payment.branchId !== user.branchId) {
        throw new ForbiddenException('Access denied to this payment');
      }
    }

    const [updated] = await this.drizzle.db
      .update(payments)
      .set({
        status: PAYMENT_STATUS.FLAGGED,
        verifiedBy: requestingUserId,
        verifiedAt: new Date(),
        note: dto.note,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, id))
      .returning();

    await this.audit.log({
      action: `Flagged payment ${payment.number}: ${dto.note}`,
      auditType: AUDIT_TYPE.PAYMENT_FLAGGED,
      entityType: 'payment',
      entityId: id,
      source: 'web',
      performedBy: requestingUserId,
      branchId: payment.branchId,
      details: { paymentNumber: payment.number, reason: dto.note },
    });

    return this.formatPayment(updated);
  }

  // -----------------------------------------------------------------------
  // reject
  // -----------------------------------------------------------------------
  async reject(id: string, dto: RejectPaymentDto, requestingUserId: string) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    if (user.userType === USER_TYPE.TEACHER) {
      throw new ForbiddenException('Only admin/superadmin can reject payments');
    }

    const [payment] = await this.drizzle.db
      .select()
      .from(payments)
      .where(and(eq(payments.id, id), isNull(payments.deletedAt)));

    if (!payment) throw new NotFoundException('Payment not found');

    if (user.userType !== USER_TYPE.SUPERADMIN) {
      if (payment.branchId !== user.branchId) {
        throw new ForbiddenException('Access denied to this payment');
      }
    }

    const wasPreviouslyVerified = payment.status === PAYMENT_STATUS.VERIFIED;

    const [updated] = await this.drizzle.db
      .update(payments)
      .set({
        status: PAYMENT_STATUS.REJECTED,
        verifiedBy: requestingUserId,
        verifiedAt: new Date(),
        note: dto.note,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, id))
      .returning();

    // If was previously verified, re-tally the period
    if (wasPreviouslyVerified) {
      await this.paymentPeriodsService.computeAndUpdatePeriodStatus(payment.periodId);
    }

    await this.audit.log({
      action: `Rejected payment ${payment.number}: ${dto.note}`,
      auditType: AUDIT_TYPE.PAYMENT_REJECTED,
      entityType: 'payment',
      entityId: id,
      source: 'web',
      performedBy: requestingUserId,
      branchId: payment.branchId,
      details: { paymentNumber: payment.number, reason: dto.note, wasPreviouslyVerified },
    });

    return this.formatPayment(updated);
  }

  // -----------------------------------------------------------------------
  // reply — teacher responds to a flag, re-queues the payment for review
  // -----------------------------------------------------------------------
  async reply(id: string, dto: ReplyPaymentDto, requestingUserId: string) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    const [payment] = await this.drizzle.db
      .select()
      .from(payments)
      .where(and(eq(payments.id, id), isNull(payments.deletedAt)));

    if (!payment) throw new NotFoundException('Payment not found');

    // Only the teacher who recorded the payment can reply.
    if (payment.recordedBy !== requestingUserId) {
      throw new ForbiddenException('Only the recording teacher can reply to a flag');
    }

    if (payment.status !== PAYMENT_STATUS.FLAGGED) {
      throw new ForbiddenException('Only flagged payments can be replied to');
    }

    const [updated] = await this.drizzle.db
      .update(payments)
      .set({
        teacherReply: dto.reply,
        teacherRepliedAt: new Date(),
        status: PAYMENT_STATUS.PENDING_REVIEW,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, id))
      .returning();

    await this.audit.log({
      action: `Teacher replied on payment ${payment.number}`,
      auditType: AUDIT_TYPE.PAYMENT_REPLIED,
      entityType: 'payment',
      entityId: id,
      source: 'web',
      performedBy: requestingUserId,
      branchId: payment.branchId,
      details: { paymentNumber: payment.number, reply: dto.reply },
    });

    return this.formatPayment(updated);
  }

  // -----------------------------------------------------------------------
  // softDelete
  // -----------------------------------------------------------------------
  async softDelete(id: string, requestingUserId: string) {
    const user = await this.usersService.findByIdFull(requestingUserId);
    if (!user) throw new UnauthorizedException();

    if (user.userType === USER_TYPE.TEACHER) {
      throw new ForbiddenException('Only admin/superadmin can delete payments');
    }

    const [payment] = await this.drizzle.db
      .select()
      .from(payments)
      .where(and(eq(payments.id, id), isNull(payments.deletedAt)));

    if (!payment) throw new NotFoundException('Payment not found');

    if (user.userType !== USER_TYPE.SUPERADMIN) {
      if (payment.branchId !== user.branchId) {
        throw new ForbiddenException('Access denied to this payment');
      }
    }

    const [deleted] = await this.drizzle.db
      .update(payments)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();

    // Recompute period status if this payment was verified
    if (payment.status === PAYMENT_STATUS.VERIFIED) {
      await this.paymentPeriodsService.computeAndUpdatePeriodStatus(payment.periodId);
    }

    await this.audit.log({
      action: `Deleted payment ${payment.number}`,
      auditType: AUDIT_TYPE.PAYMENT_DELETED,
      entityType: 'payment',
      entityId: id,
      source: 'web',
      performedBy: requestingUserId,
      branchId: payment.branchId,
      details: { paymentNumber: payment.number, amount: fromScaled(Number(payment.amount)) },
    });

    return deleted;
  }
}
