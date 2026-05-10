// ---------------------------------------------------------------------------
// USER_TYPE
// ---------------------------------------------------------------------------
export const USER_TYPE = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  TEACHER: 'teacher',
} as const;

export type UserType = (typeof USER_TYPE)[keyof typeof USER_TYPE];

// ---------------------------------------------------------------------------
// USER_STATUS
// ---------------------------------------------------------------------------
export const USER_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  REJECTED: 'rejected',
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

// ---------------------------------------------------------------------------
// STUDENT_STATUS
// ---------------------------------------------------------------------------
export const STUDENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  WITHDRAWN: 'withdrawn',
} as const;

export type StudentStatus = (typeof STUDENT_STATUS)[keyof typeof STUDENT_STATUS];

// ---------------------------------------------------------------------------
// PERIOD_STATUS
// ---------------------------------------------------------------------------
export const PERIOD_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue',
} as const;

export type PeriodStatus = (typeof PERIOD_STATUS)[keyof typeof PERIOD_STATUS];

// ---------------------------------------------------------------------------
// PAYMENT_METHOD
// ---------------------------------------------------------------------------
export const PAYMENT_METHOD = {
  BANK_TRANSFER: 'bank_transfer',
  GCASH: 'gcash',
  CASH: 'cash',
  OTHER: 'other',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

// ---------------------------------------------------------------------------
// PAYMENT_STATUS
// ---------------------------------------------------------------------------
export const PAYMENT_STATUS = {
  PENDING_REVIEW: 'pending_review',
  VERIFIED: 'verified',
  FLAGGED: 'flagged',
  REJECTED: 'rejected',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

// ---------------------------------------------------------------------------
// AUDIT_TYPE
// ---------------------------------------------------------------------------
export const AUDIT_TYPE = {
  // Payment lifecycle
  PAYMENT_RECORDED: 'payment_recorded',
  PAYMENT_VERIFIED: 'payment_verified',
  PAYMENT_FLAGGED: 'payment_flagged',
  PAYMENT_REJECTED: 'payment_rejected',
  // Student lifecycle
  STUDENT_ENROLLED: 'student_enrolled',
  STUDENT_STATUS_CHANGED: 'student_status_changed',
  STUDENT_REASSIGNED: 'student_reassigned',
  // Family
  FAMILY_CREATED: 'family_created',
  FAMILY_UPDATED: 'family_updated',
  // Payment periods
  PERIOD_CREATED: 'period_created',
  PERIOD_ADJUSTED: 'period_adjusted',
  // User management
  USER_CREATED: 'user_created',
  USER_STATUS_CHANGED: 'user_status_changed',
  // Family
  FAMILY_DELETED: 'family_deleted',
  // Student lifecycle (continued)
  STUDENT_UPDATED: 'student_updated',
  STUDENT_DELETED: 'student_deleted',
  // Payment periods (continued)
  PERIOD_DELETED: 'period_deleted',
  PERIOD_BULK_GENERATED: 'period_bulk_generated',
  // Payment lifecycle (continued)
  PAYMENT_DELETED: 'payment_deleted',
  PAYMENT_REPLIED: 'payment_replied',
  // Branch
  BRANCH_CREATED: 'branch_created',
  BRANCH_UPDATED: 'branch_updated',
  BRANCH_DELETED: 'branch_deleted',
  // User management (continued)
  USER_DELETED: 'user_deleted',
  // Data ops
  DATA_IMPORTED: 'data_imported',
  DATA_EXPORTED: 'data_exported',
} as const;

export type AuditType = (typeof AUDIT_TYPE)[keyof typeof AUDIT_TYPE];

// ---------------------------------------------------------------------------
// Money helpers — scaled integer (same pattern as sneaker-doc-pos)
// All monetary values stored as bigint × 100 (e.g. ₱1,234.56 → 123456)
// ---------------------------------------------------------------------------
export const SCALE_FACTOR = 100;

export function toScaled(amount: number): number {
  return Math.round(amount * SCALE_FACTOR);
}

export function fromScaled(scaled: number): number {
  return scaled / SCALE_FACTOR;
}

// ---------------------------------------------------------------------------
// Payment number generator — "PAY-0001", "PAY-0002", ...
// ---------------------------------------------------------------------------
export function formatPaymentNumber(seq: number): string {
  return `PAY-${String(seq).padStart(4, '0')}`;
}
