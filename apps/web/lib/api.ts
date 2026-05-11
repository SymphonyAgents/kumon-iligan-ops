import type {
  Branch,
  AppUser,
  Family,
  FamilyMember,
  FamilyMemberRelation,
  Student,
  PaymentPeriod,
  Payment,
  AuditEntry,
  AssignableUser,
  BulkGenerateResult,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const res = await fetch('/api/auth/session');
  const session = res.ok ? await res.json() : null;
  const userId = session?.user?.id;
  return {
    'Content-Type': 'application/json',
    ...(userId ? { 'x-user-id': userId } : {}),
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...authHeaders, ...init?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, (err as { message?: string }).message ?? 'Request failed');
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
export const api = {
  // ----- Branches -----
  branches: {
    list: () => apiFetch<Branch[]>('/branches'),
    listActive: () => apiFetch<Branch[]>('/branches/active'),
    get: (id: string) => apiFetch<Branch>(`/branches/${id}`),
    create: (data: {
      name: string;
      streetName?: string;
      barangay?: string;
      city?: string;
      province?: string;
      country?: string;
      phone?: string;
    }) => apiFetch<Branch>('/branches', { method: 'POST', body: JSON.stringify(data) }),
    update: (
      id: string,
      data: Partial<{
        name: string;
        streetName: string;
        barangay: string;
        city: string;
        province: string;
        country: string;
        phone: string;
        isActive: boolean;
      }>,
    ) => apiFetch<Branch>(`/branches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch<void>(`/branches/${id}`, { method: 'DELETE' }),
  },

  // ----- Users -----
  users: {
    list: (branchId?: string) => {
      const qs = branchId ? `?branchId=${branchId}` : '';
      return apiFetch<AppUser[]>(`/users${qs}`);
    },
    get: (id: string) => apiFetch<AppUser>(`/users/${id}`),
    getCurrent: () => apiFetch<AppUser>('/users/me'),
    assignable: (branchId?: string | null) => {
      const qs = branchId ? `?branchId=${branchId}` : '';
      return apiFetch<AssignableUser[]>(`/users/assignable${qs}`);
    },
    approve: (id: string) => apiFetch<AppUser>(`/users/${id}/approve`, { method: 'PATCH' }),
    reject: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/users/${id}/reject`, { method: 'PATCH' }),
    updateRole: (id: string, userType: string) =>
      apiFetch<AppUser>(`/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ userType }),
      }),
    updateBranch: (id: string, branchId: string) =>
      apiFetch<AppUser>(`/users/${id}/branch`, {
        method: 'PATCH',
        body: JSON.stringify({ branchId }),
      }),
    updateProfile: (id: string, data: Partial<AppUser>) =>
      apiFetch<AppUser>(`/users/${id}/profile`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch<void>(`/users/${id}`, { method: 'DELETE' }),
    syncUser: (data: { id: string; email: string; name: string | null; image: string | null }) =>
      apiFetch<Pick<AppUser, 'id' | 'userType' | 'status' | 'branchId' | 'fullName' | 'nickname'>>(
        '/users/sync',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
      ),
  },

  // ----- Families -----
  families: {
    list: (params?: { branchId?: string; search?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>);
      return apiFetch<Family[]>(`/families?${qs}`);
    },
    get: (id: string) => apiFetch<Family>(`/families/${id}`),
    create: (data: {
      guardianName: string;
      guardianPhone: string;
      guardianEmail?: string;
      streetName?: string;
      barangay?: string;
      city?: string;
      province?: string;
      country?: string;
      notes?: string;
      branchId?: string;
    }) => apiFetch<Family>('/families', { method: 'POST', body: JSON.stringify(data) }),
    update: (
      id: string,
      data: Partial<{
        guardianName: string;
        guardianPhone: string;
        guardianEmail: string;
        streetName: string;
        barangay: string;
        city: string;
        province: string;
        country: string;
        notes: string;
      }>,
    ) => apiFetch<Family>(`/families/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch<void>(`/families/${id}`, { method: 'DELETE' }),
  },

  // ----- Family members -----
  familyMembers: {
    list: (familyId: string) => apiFetch<FamilyMember[]>(`/families/${familyId}/members`),
    create: (
      familyId: string,
      data: {
        fullName: string;
        phone?: string;
        email?: string;
        relation: FamilyMemberRelation;
        isPrimary?: boolean;
      },
    ) =>
      apiFetch<FamilyMember>(`/families/${familyId}/members`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (
      familyId: string,
      memberId: string,
      data: Partial<{
        fullName: string;
        phone: string;
        email: string;
        relation: FamilyMemberRelation;
        isPrimary: boolean;
      }>,
    ) =>
      apiFetch<FamilyMember>(`/families/${familyId}/members/${memberId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (familyId: string, memberId: string) =>
      apiFetch<{ deleted: boolean }>(`/families/${familyId}/members/${memberId}`, {
        method: 'DELETE',
      }),
  },

  // ----- Students -----
  students: {
    list: (params?: {
      branchId?: string;
      teacherId?: string;
      status?: string;
      search?: string;
    }) => {
      const qs = new URLSearchParams(params as Record<string, string>);
      return apiFetch<Student[]>(`/students?${qs}`);
    },
    get: (id: string) => apiFetch<Student>(`/students/${id}`),
    enroll: (data: {
      familyId: string;
      firstName: string;
      lastName: string;
      enrollmentDate: string;
      level?: string;
      branchId?: string;
    }) => apiFetch<Student>('/students', { method: 'POST', body: JSON.stringify(data) }),
    update: (
      id: string,
      data: Partial<{
        firstName: string;
        lastName: string;
        level: string;
        enrollmentDate: string;
        familyId: string;
        branchId: string;
      }>,
    ) => apiFetch<Student>(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    changeStatus: (id: string, data: { status: string; reason?: string }) =>
      apiFetch<Student>(`/students/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
    assignTeacher: (id: string, data: { teacherId: string }) =>
      apiFetch<{ id: string; teacherId: string }>(`/students/${id}/assign-teacher`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => apiFetch<void>(`/students/${id}`, { method: 'DELETE' }),
  },

  // ----- Payment Periods -----
  paymentPeriods: {
    list: (params?: {
      studentId?: string;
      periodMonth?: number;
      periodYear?: number;
      status?: string;
      branchId?: string;
    }) => {
      const qs = new URLSearchParams(
        Object.fromEntries(
          Object.entries(params ?? {})
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, String(v)]),
        ),
      );
      return apiFetch<PaymentPeriod[]>(`/payment-periods?${qs}`);
    },
    get: (id: string) => apiFetch<PaymentPeriod>(`/payment-periods/${id}`),
    create: (data: {
      studentId: string;
      periodMonth: number;
      periodYear: number;
      expectedAmount: number;
      dueDate: string;
    }) =>
      apiFetch<PaymentPeriod>('/payment-periods', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { expectedAmount?: number; dueDate?: string }) =>
      apiFetch<PaymentPeriod>(`/payment-periods/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    bulkGenerate: (data: {
      periodMonth: number;
      periodYear: number;
      expectedAmount: number;
      dueDate: string;
      branchId?: string;
    }) =>
      apiFetch<BulkGenerateResult>('/payment-periods/bulk-generate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => apiFetch<void>(`/payment-periods/${id}`, { method: 'DELETE' }),
  },

  // ----- Payments -----
  payments: {
    list: (params?: {
      branchId?: string;
      teacherId?: string;
      status?: string;
      periodId?: string;
      studentId?: string;
      familyId?: string;
      dateFrom?: string;
      dateTo?: string;
    }) => {
      const qs = new URLSearchParams(params as Record<string, string>);
      return apiFetch<Payment[]>(`/payments?${qs}`);
    },
    get: (id: string) => apiFetch<Payment>(`/payments/${id}`),
    record: (data: {
      studentId: string;
      periodId: string;
      amount: number;
      paymentMethod: string;
      referenceNumber: string;
      receiptImageUrl: string;
      paymentDate: string;
      note?: string;
      paidByMemberId?: string;
    }) => apiFetch<Payment>('/payments', { method: 'POST', body: JSON.stringify(data) }),
    verify: (id: string, data?: { note?: string }) =>
      apiFetch<Payment>(`/payments/${id}/verify`, {
        method: 'PATCH',
        body: JSON.stringify(data ?? {}),
      }),
    flag: (id: string, data: { note: string }) =>
      apiFetch<Payment>(`/payments/${id}/flag`, { method: 'PATCH', body: JSON.stringify(data) }),
    reject: (id: string, data: { note: string }) =>
      apiFetch<Payment>(`/payments/${id}/reject`, { method: 'PATCH', body: JSON.stringify(data) }),
    reply: (id: string, data: { reply: string }) =>
      apiFetch<Payment>(`/payments/${id}/reply`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch<void>(`/payments/${id}`, { method: 'DELETE' }),
    // Receipt upload — get presigned URL then PUT the file
    getUploadUrl: (params: { fileName: string; fileType: string }) =>
      apiFetch<{ uploadUrl: string; fileUrl: string }>(
        `/uploads/receipt?fileName=${params.fileName}&fileType=${params.fileType}`,
      ),
  },

  // ----- Audit -----
  audit: {
    list: (params?: {
      limit?: number;
      month?: number;
      year?: number;
      performedBy?: string;
      branchId?: string;
    }) => {
      const qs = new URLSearchParams(
        Object.fromEntries(
          Object.entries(params ?? {})
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, String(v)]),
        ),
      );
      return apiFetch<AuditEntry[]>(`/audit?${qs}`);
    },
    byEntity: (entityType: string, entityId: string) =>
      apiFetch<AuditEntry[]>(`/audit/entity/${entityType}/${entityId}`),
  },
};
