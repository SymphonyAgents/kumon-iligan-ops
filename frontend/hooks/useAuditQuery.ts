'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const AUDIT_KEY = ['audit'] as const;

export interface AuditFilters {
  month?: number;
  year?: number;
  performedBy?: string;
}

export function useAuditQuery(filters?: AuditFilters) {
  return useQuery({
    queryKey: [...AUDIT_KEY, filters],
    queryFn: () => api.audit.list(filters),
    staleTime: 60 * 1000,
  });
}
