'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export const SERVICES_KEY = ['services'] as const;

interface UpdateServiceVars {
  id: number;
  form: { name: string; type: 'primary' | 'add_on'; price: string };
}

export function useServicesQuery() {
  return useQuery({
    queryKey: SERVICES_KEY,
    queryFn: () => api.services.list(),
  });
}

export function useUpdateServiceMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, form }: UpdateServiceVars) => api.services.update(id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SERVICES_KEY });
      toast.success('Service updated');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to update service', { description: err.message }),
  });
}

export function useToggleServiceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      api.services.update(id, { isActive }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: SERVICES_KEY });
      toast.success(vars.isActive ? 'Service activated' : 'Service deactivated');
    },
    onError: (err: Error) => toast.error('Failed to update service', { description: err.message }),
  });
}

export function useDeleteServiceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.services.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SERVICES_KEY });
      toast.success('Service deleted');
    },
    onError: (err: Error) => toast.error('Failed to delete service', { description: err.message }),
  });
}
