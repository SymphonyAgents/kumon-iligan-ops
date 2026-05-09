import type { UserType, UserStatus, StudentStatus, PaymentStatus, PaymentMethod, PeriodStatus } from './constants';
export type { UserType, UserStatus, StudentStatus, PaymentStatus, PaymentMethod, PeriodStatus };

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

export interface Branch {
  id: string;
  name: string;
  streetName: string | null;
  barangay: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  phone: string | null;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
}

export interface AppUser {
  id: string;
  email: string;
  nickname: string | null;
  fullName: string | null;
  contactNumber: string | null;
  birthday: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactNumber: string | null;
  userType: UserType;
  status: UserStatus;
  branchId: string | null;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
}

export interface Family {
  id: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string | null;
  streetName: string | null;
  barangay: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  notes: string | null;
  branchId: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  students?: Student[];
}

export interface Student {
  id: string;
  familyId: string;
  branchId: string;
  firstName: string;
  lastName: string;
  level: string | null;
  enrollmentDate: string;
  status: StudentStatus;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // joined fields
  guardianName?: string | null;
  guardianPhone?: string | null;
  teacherId?: string | null;
  teacherName?: string | null;
  // from findOne
  family?: Family | null;
  currentAssignment?: StudentTeacherAssignment | null;
  currentPeriod?: PaymentPeriod | null;
}

export interface StudentTeacherAssignment {
  id: string;
  studentId: string;
  teacherId: string;
  branchId: string;
  isActive: boolean;
  assignedAt: string;
  unassignedAt: string | null;
  // joined fields
  teacherName?: string | null;
  teacherEmail?: string | null;
}

export interface PaymentPeriod {
  id: string;
  studentId: string;
  periodMonth: number;
  periodYear: number;
  expectedAmount: number;
  paidAmount: number;
  dueDate: string;
  status: PeriodStatus;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // joined fields
  studentFirstName?: string | null;
  studentLastName?: string | null;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  number: string;
  studentId: string;
  familyId: string;
  periodId: string;
  amount: number;
  expectedAmountSnapshot: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  receiptImageUrl: string | null;
  paymentDate: string;
  status: PaymentStatus;
  note: string | null;
  recordedBy: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  teacherReply: string | null;
  teacherRepliedAt: string | null;
  branchId: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // joined fields
  studentFirstName?: string | null;
  studentLastName?: string | null;
  guardianName?: string | null;
  recordedByName?: string | null;
}

export interface AuditEntry {
  id: string;
  createdAt: string;
  action: string;
  auditType: string | null;
  entityType: string;
  entityId: string | null;
  source: string | null;
  performedBy: string | null;
  performedByEmail: string | null;
  performedByFullName: string | null;
  branchId: string | null;
  details: Record<string, unknown> | null;
}

export interface AssignableUser {
  id: string;
  nickname: string | null;
  fullName: string | null;
  email: string;
  userType: UserType;
  branchId: string | null;
}

// ---------------------------------------------------------------------------
// API response helpers
// ---------------------------------------------------------------------------

export interface BulkGenerateResult {
  created: number;
  skipped: number;
}
