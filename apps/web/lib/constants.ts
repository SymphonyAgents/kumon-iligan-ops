// ---------------------------------------------------------------------------
// User roles
// ---------------------------------------------------------------------------
export const USER_TYPE = {
  TEACHER: 'teacher',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
} as const;
export type UserType = (typeof USER_TYPE)[keyof typeof USER_TYPE];

export const USER_TYPE_LABELS: Record<string, string> = {
  teacher: 'Teacher',
  admin: 'Admin',
  superadmin: 'Superadmin',
};

export const USER_TYPE_STYLES: Record<string, string> = {
  teacher: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  admin: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300',
  superadmin: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
};

export const USER_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  REJECTED: 'rejected',
} as const;
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

// ---------------------------------------------------------------------------
// Student
// ---------------------------------------------------------------------------
export const STUDENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  WITHDRAWN: 'withdrawn',
} as const;
export type StudentStatus = (typeof STUDENT_STATUS)[keyof typeof STUDENT_STATUS];

export const STUDENT_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  withdrawn: 'Withdrawn',
};

export const STUDENT_STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  inactive: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  withdrawn: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------
export const PAYMENT_STATUS = {
  PENDING_REVIEW: 'pending_review',
  VERIFIED: 'verified',
  FLAGGED: 'flagged',
  REJECTED: 'rejected',
} as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending_review: 'Pending Review',
  verified: 'Verified',
  flagged: 'Flagged',
  rejected: 'Rejected',
};

export const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending_review: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  verified: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  flagged: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  rejected: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
};

export const PAYMENT_METHOD = {
  BANK_TRANSFER: 'bank_transfer',
  GCASH: 'gcash',
  CASH: 'cash',
  OTHER: 'other',
} as const;
export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  gcash: 'GCash',
  cash: 'Cash',
  other: 'Other',
};

export const PAYMENT_METHOD_STYLES: Record<string, string> = {
  bank_transfer: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  gcash: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  cash: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  other: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
};

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'gcash', label: 'GCash' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
] as const;

// ---------------------------------------------------------------------------
// Payment period
// ---------------------------------------------------------------------------
export const PERIOD_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue',
} as const;
export type PeriodStatus = (typeof PERIOD_STATUS)[keyof typeof PERIOD_STATUS];

export const PERIOD_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  partial: 'Partial',
  paid: 'Paid',
  overdue: 'Overdue',
};

export const PERIOD_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
  partial: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  overdue: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
};

// ---------------------------------------------------------------------------
// Audit types
// ---------------------------------------------------------------------------
export const AUDIT_TYPE_LABELS: Record<string, string> = {
  payment_recorded: 'Payment Recorded',
  payment_verified: 'Payment Verified',
  payment_flagged: 'Payment Flagged',
  payment_rejected: 'Payment Rejected',
  payment_deleted: 'Payment Deleted',
  student_enrolled: 'Student Enrolled',
  student_updated: 'Student Updated',
  student_status_changed: 'Student Status Changed',
  student_reassigned: 'Student Reassigned',
  student_deleted: 'Student Deleted',
  family_created: 'Family Created',
  family_updated: 'Family Updated',
  family_deleted: 'Family Deleted',
  period_created: 'Period Created',
  period_adjusted: 'Period Adjusted',
  period_deleted: 'Period Deleted',
  period_bulk_generated: 'Periods Bulk Generated',
  user_created: 'User Created',
  user_status_changed: 'User Status Changed',
  user_deleted: 'User Deleted',
  branch_created: 'Branch Created',
  branch_updated: 'Branch Updated',
  branch_deleted: 'Branch Deleted',
  data_imported: 'Data Imported',
  data_exported: 'Data Exported',
};

export const AUDIT_TYPE_STYLES: Record<string, string> = {
  payment_recorded: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  payment_verified: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  payment_flagged: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  payment_rejected: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  payment_deleted: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  student_enrolled: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  student_updated: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  student_status_changed: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  student_reassigned: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  student_deleted: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  family_created: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  family_updated: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  family_deleted: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  period_created: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  period_adjusted: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  period_bulk_generated: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  period_deleted: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  user_created: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  user_status_changed: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  user_deleted: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  branch_created: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  branch_updated: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  branch_deleted: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  data_imported: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  data_exported: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
};

export const ENTITY_LABELS: Record<string, string> = {
  payment: 'Payment',
  student: 'Student',
  family: 'Family',
  payment_period: 'Payment Period',
  user: 'User',
  branch: 'Branch',
};

export const SOURCE_LABELS: Record<string, string> = {
  web: 'Web',
  import: 'Import',
  system: 'System',
};

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
