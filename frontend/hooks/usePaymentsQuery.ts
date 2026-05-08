'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export const PAYMENTS_KEY = ['payments'] as const;

export function usePaymentsQuery(params?: Parameters<typeof api.payments.list>[0]) {
  return useQuery({
    queryKey: [...PAYMENTS_KEY, params],
    queryFn: () => api.payments.list(params),
  });
}

export function usePaymentQuery(id: string) {
  return useQuery({
    queryKey: ['payments', id],
    queryFn: () => api.payments.get(id),
    enabled: !!id,
  });
}

export function useRecordPaymentMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.payments.record>[0]) => api.payments.record(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PAYMENTS_KEY });
      void qc.invalidateQueries({ queryKey: ['payment-periods'] });
      toast.success('Payment recorded');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to record payment', { description: err.message }),
  });
}

export function useVerifyPaymentMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => api.payments.verify(id, { note }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PAYMENTS_KEY });
      void qc.invalidateQueries({ queryKey: ['payment-periods'] });
      toast.success('Payment verified');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to verify payment', { description: err.message }),
  });
}

export function useFlagPaymentMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => api.payments.flag(id, { note }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PAYMENTS_KEY });
      toast.success('Payment flagged');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to flag payment', { description: err.message }),
  });
}

export function useRejectPaymentMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => api.payments.reject(id, { note }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PAYMENTS_KEY });
      void qc.invalidateQueries({ queryKey: ['payment-periods'] });
      toast.success('Payment rejected');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to reject payment', { description: err.message }),
  });
}

export function useReplyPaymentMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) => api.payments.reply(id, { reply }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PAYMENTS_KEY });
      toast.success('Reply sent');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to send reply', { description: err.message }),
  });
}

export function useDeletePaymentMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.payments.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PAYMENTS_KEY });
      toast.success('Payment deleted');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to delete payment', { description: err.message }),
  });
}
