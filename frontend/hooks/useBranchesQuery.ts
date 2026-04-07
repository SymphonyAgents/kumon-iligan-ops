'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export const BRANCHES_KEY = ['branches'] as const;

export function useBranchesQuery() {
  return useQuery({
    queryKey: BRANCHES_KEY,
    queryFn: () => api.branches.list(),
  });
}

export function useCreateBranchMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; streetName?: string; barangay?: string; city?: string; province?: string; country?: string; phone?: string }) => api.branches.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BRANCHES_KEY });
      toast.success('Branch created');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to create branch', { description: err.message }),
  });
}

export function useUpdateBranchMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      api.branches.update(id, body as Partial<{ name: string; streetName: string; barangay: string; city: string; province: string; country: string; phone: string; isActive: boolean }>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BRANCHES_KEY });
      toast.success('Branch updated');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to update branch', { description: err.message }),
  });
}

export function useDeleteBranchMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.branches.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BRANCHES_KEY });
      toast.success('Branch deleted');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to delete branch', { description: err.message }),
  });
}
