'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export const FAMILIES_KEY = ['families'] as const;

export function useFamiliesQuery(params?: Parameters<typeof api.families.list>[0]) {
  return useQuery({
    queryKey: [...FAMILIES_KEY, params],
    queryFn: () => api.families.list(params),
  });
}

export function useFamilyQuery(id: string) {
  return useQuery({
    queryKey: ['families', id],
    queryFn: () => api.families.get(id),
    enabled: !!id,
  });
}

export function useCreateFamilyMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.families.create>[0]) => api.families.create(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: FAMILIES_KEY });
      toast.success('Family added');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to add family', { description: err.message }),
  });
}

export function useUpdateFamilyMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.families.update>[1] }) =>
      api.families.update(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: FAMILIES_KEY });
      toast.success('Family updated');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to update family', { description: err.message }),
  });
}

export function useDeleteFamilyMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.families.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: FAMILIES_KEY });
      toast.success('Family removed');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to remove family', { description: err.message }),
  });
}
