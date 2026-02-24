'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export const PROMOS_KEY = ['promos'] as const;

export function usePromosQuery() {
  return useQuery({
    queryKey: PROMOS_KEY,
    queryFn: () => api.promos.list(),
  });
}

export function useDeletePromoMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.promos.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROMOS_KEY });
      toast.success('Promo deleted');
    },
    onError: (err: Error) => toast.error('Failed to delete promo', { description: err.message }),
  });
}
