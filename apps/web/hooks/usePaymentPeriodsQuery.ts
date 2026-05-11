'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export const PERIODS_KEY = ['payment-periods'] as const;

export function usePaymentPeriodsQuery(params?: Parameters<typeof api.paymentPeriods.list>[0]) {
  return useQuery({
    queryKey: [...PERIODS_KEY, params],
    queryFn: () => api.paymentPeriods.list(params),
  });
}

export function usePaymentPeriodQuery(id: string) {
  return useQuery({
    queryKey: ['payment-periods', id],
    queryFn: () => api.paymentPeriods.get(id),
    enabled: !!id,
  });
}

export function useStudentPeriodsQuery(studentId: string) {
  return useQuery({
    queryKey: [...PERIODS_KEY, { studentId }],
    queryFn: () => api.paymentPeriods.list({ studentId }),
    enabled: !!studentId,
  });
}

export function useCreatePeriodMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.paymentPeriods.create>[0]) =>
      api.paymentPeriods.create(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PERIODS_KEY });
      toast.success('Period created');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to create period', { description: err.message }),
  });
}

export function useUpdatePeriodMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof api.paymentPeriods.update>[1];
    }) => api.paymentPeriods.update(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PERIODS_KEY });
      toast.success('Period updated');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to update period', { description: err.message }),
  });
}

export function useBulkGeneratePeriodsMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.paymentPeriods.bulkGenerate>[0]) =>
      api.paymentPeriods.bulkGenerate(data),
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: PERIODS_KEY });
      toast.success(`Periods generated: ${result.created} created, ${result.skipped} skipped`);
      onSuccess?.();
    },
    onError: (err: Error) =>
      toast.error('Failed to bulk generate periods', { description: err.message }),
  });
}

export function useDeletePeriodMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.paymentPeriods.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PERIODS_KEY });
      toast.success('Period deleted');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to delete period', { description: err.message }),
  });
}
