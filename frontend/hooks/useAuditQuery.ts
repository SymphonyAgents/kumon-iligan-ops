'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const AUDIT_KEY = ['audit'] as const;

export function useAuditQuery() {
  return useQuery({
    queryKey: AUDIT_KEY,
    queryFn: () => api.audit.list(),
    staleTime: 60 * 1000,
  });
}
