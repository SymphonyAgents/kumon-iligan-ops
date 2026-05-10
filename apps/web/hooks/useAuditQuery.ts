'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const AUDIT_KEY = ['audit'] as const;

export interface AuditFilters {
  limit?: number;
  month?: number;
  year?: number;
  performedBy?: string;
  branchId?: string;
}

export function useAuditQuery(filters?: AuditFilters) {
  return useQuery({
    queryKey: [...AUDIT_KEY, filters],
    queryFn: () => api.audit.list(filters),
  });
}
