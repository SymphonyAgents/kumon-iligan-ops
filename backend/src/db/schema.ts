import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  date,
  timestamp,
  jsonb,
  bigint,
  smallint,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// branches
// ---------------------------------------------------------------------------
export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).unique().notNull(),
  streetName: varchar('street_name', { length: 255 }),
  barangay: varchar('barangay', { length: 255 }),
  city: varchar('city', { length: 255 }),
  province: varchar('province', { length: 255 }),
  country: varchar('country', { length: 255 }).default('PH'),
  phone: varchar('phone', { length: 20 }),
  isActive: boolean('is_active').default(true).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// users — teachers, admins, superadmins
// ---------------------------------------------------------------------------
export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // matches NextAuth/Google OAuth user id
  email: varchar('email', { length: 255 }).unique().notNull(),
  nickname: varchar('nickname', { length: 100 }),
  fullName: varchar('full_name', { length: 255 }),
  contactNumber: varchar('contact_number', { length: 20 }),
  birthday: date('birthday'),
  address: text('address'),
  emergencyContactName: varchar('emergency_contact_name', { length: 255 }),
  emergencyContactNumber: varchar('emergency_contact_number', { length: 20 }),
  userType: varchar('user_type', { length: 20 }).default('teacher').notNull(), // superadmin | admin | teacher
  status: varchar('status', { length: 20 }).default('pending').notNull(), // active | pending | rejected
  branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
  isActive: boolean('is_active').default(true).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// families — guardian/parent records
// ---------------------------------------------------------------------------
export const families = pgTable('families', {
  id: uuid('id').primaryKey().defaultRandom(),
  guardianName: varchar('guardian_name', { length: 255 }).notNull(),
  guardianPhone: varchar('guardian_phone', { length: 20 }).unique().notNull(), // primary lookup key
  guardianEmail: varchar('guardian_email', { length: 255 }),
  streetName: varchar('street_name', { length: 255 }),
  barangay: varchar('barangay', { length: 255 }),
  city: varchar('city', { length: 255 }),
  province: varchar('province', { length: 255 }),
  country: varchar('country', { length: 255 }).default('PH'),
  notes: text('notes'), // irregular cases: "pays two kids together", "usually late"
  branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'restrict' }).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// students — enrolled students
// ---------------------------------------------------------------------------
export const students = pgTable('students', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').references(() => families.id, { onDelete: 'restrict' }).notNull(),
  branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'restrict' }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  level: varchar('level', { length: 50 }), // "Pre-school", "Level 1", "Level 2A", etc.
  enrollmentDate: date('enrollment_date').notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(), // active | inactive | withdrawn
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// student_teacher_assignments
// Partial unique index enforces one active teacher per student at DB level
// ---------------------------------------------------------------------------
export const studentTeacherAssignments = pgTable(
  'student_teacher_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studentId: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
    teacherId: uuid('teacher_id').references(() => users.id, { onDelete: 'restrict' }).notNull(),
    branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'restrict' }).notNull(), // denormalized from student
    isActive: boolean('is_active').default(true).notNull(),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
    unassignedAt: timestamp('unassigned_at', { withTimezone: true }), // null = currently active
  },
  (table) => [
    uniqueIndex('sta_one_active_teacher_per_student')
      .on(table.studentId)
      .where(sql`${table.isActive} = true`),
  ],
);

// ---------------------------------------------------------------------------
// payment_periods — monthly billing cycles per student
// ---------------------------------------------------------------------------
export const paymentPeriods = pgTable(
  'payment_periods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studentId: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
    periodMonth: smallint('period_month').notNull(), // 1–12
    periodYear: smallint('period_year').notNull(),   // e.g. 2026
    expectedAmount: bigint('expected_amount', { mode: 'number' }).notNull(), // scaled integer
    paidAmount: bigint('paid_amount', { mode: 'number' }).default(0).notNull(), // running total of verified payments
    dueDate: date('due_date').notNull(),
    status: varchar('status', { length: 20 }).default('pending').notNull(), // pending | partial | paid | overdue
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('payment_periods_student_month_year_unique')
      .on(table.studentId, table.periodMonth, table.periodYear),
  ],
);

// ---------------------------------------------------------------------------
// payments — individual payment records (merged transactions + claim_payments)
// ---------------------------------------------------------------------------
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: varchar('number', { length: 10 }).unique().notNull(), // e.g. "PAY-0001"
  studentId: uuid('student_id').references(() => students.id, { onDelete: 'restrict' }).notNull(),
  familyId: uuid('family_id').references(() => families.id, { onDelete: 'restrict' }).notNull(), // denormalized
  periodId: uuid('period_id').references(() => paymentPeriods.id, { onDelete: 'restrict' }).notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull(), // actual amount paid, scaled integer
  expectedAmountSnapshot: bigint('expected_amount_snapshot', { mode: 'number' }).notNull(), // snapshot at time of recording
  paymentMethod: varchar('payment_method', { length: 20 }).notNull(), // bank_transfer | gcash | cash | other
  referenceNumber: varchar('reference_number', { length: 100 }), // bank/GCash reference from receipt
  receiptImageUrl: text('receipt_image_url'), // uploaded screenshot
  paymentDate: date('payment_date').notNull(), // when the parent actually paid
  status: varchar('status', { length: 20 }).default('pending_review').notNull(), // pending_review | verified | flagged | rejected
  note: text('note'),
  recordedBy: uuid('recorded_by').references(() => users.id, { onDelete: 'restrict' }).notNull(), // teacher
  verifiedBy: uuid('verified_by').references(() => users.id, { onDelete: 'set null' }), // admin
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  teacherReply: text('teacher_reply'), // teacher's response to a flag
  teacherRepliedAt: timestamp('teacher_replied_at', { withTimezone: true }),
  branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'restrict' }).notNull(), // denormalized
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// audit_log
// ---------------------------------------------------------------------------
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  action: varchar('action', { length: 50 }).notNull(), // create | update | delete | verify | reject
  auditType: varchar('audit_type', { length: 50 }).notNull(), // see AUDIT_TYPE constants
  entityType: varchar('entity_type', { length: 50 }).notNull(), // payments | students | families | etc.
  entityId: uuid('entity_id').notNull(),
  source: varchar('source', { length: 50 }), // web | import | system
  performedBy: uuid('performed_by').references(() => users.id, { onDelete: 'set null' }),
  branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
  details: jsonb('details'), // freeform: old values, new values, metadata
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------
export const branchesRelations = relations(branches, ({ many }) => ({
  users: many(users),
  families: many(families),
  students: many(students),
  payments: many(payments),
  studentTeacherAssignments: many(studentTeacherAssignments),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  branch: one(branches, {
    fields: [users.branchId],
    references: [branches.id],
  }),
  studentAssignments: many(studentTeacherAssignments),
  recordedPayments: many(payments, { relationName: 'recordedPayments' }),
  verifiedPayments: many(payments, { relationName: 'verifiedPayments' }),
}));

export const familiesRelations = relations(families, ({ one, many }) => ({
  branch: one(branches, {
    fields: [families.branchId],
    references: [branches.id],
  }),
  students: many(students),
  payments: many(payments),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  family: one(families, {
    fields: [students.familyId],
    references: [families.id],
  }),
  branch: one(branches, {
    fields: [students.branchId],
    references: [branches.id],
  }),
  teacherAssignments: many(studentTeacherAssignments),
  paymentPeriods: many(paymentPeriods),
  payments: many(payments),
}));

export const studentTeacherAssignmentsRelations = relations(
  studentTeacherAssignments,
  ({ one }) => ({
    student: one(students, {
      fields: [studentTeacherAssignments.studentId],
      references: [students.id],
    }),
    teacher: one(users, {
      fields: [studentTeacherAssignments.teacherId],
      references: [users.id],
    }),
    branch: one(branches, {
      fields: [studentTeacherAssignments.branchId],
      references: [branches.id],
    }),
  }),
);

export const paymentPeriodsRelations = relations(paymentPeriods, ({ one, many }) => ({
  student: one(students, {
    fields: [paymentPeriods.studentId],
    references: [students.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  student: one(students, {
    fields: [payments.studentId],
    references: [students.id],
  }),
  family: one(families, {
    fields: [payments.familyId],
    references: [families.id],
  }),
  period: one(paymentPeriods, {
    fields: [payments.periodId],
    references: [paymentPeriods.id],
  }),
  recordedByUser: one(users, {
    fields: [payments.recordedBy],
    references: [users.id],
    relationName: 'recordedPayments',
  }),
  verifiedByUser: one(users, {
    fields: [payments.verifiedBy],
    references: [users.id],
    relationName: 'verifiedPayments',
  }),
  branch: one(branches, {
    fields: [payments.branchId],
    references: [branches.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  performedByUser: one(users, {
    fields: [auditLog.performedBy],
    references: [users.id],
  }),
  branch: one(branches, {
    fields: [auditLog.branchId],
    references: [branches.id],
  }),
}));
