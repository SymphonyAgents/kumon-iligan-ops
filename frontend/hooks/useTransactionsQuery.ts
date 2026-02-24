'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { TransactionStatus, PaymentMethod } from '@/lib/types';

export const TRANSACTIONS_KEY = ['transactions'] as const;

export const transactionDetailKey = (id: string) => ['transaction', id] as const;

export function useTransactionsQuery(params?: Record<string, string>) {
  return useQuery({
    queryKey: params ? [...TRANSACTIONS_KEY, params] : TRANSACTIONS_KEY,
    queryFn: () => api.transactions.list(params),
  });
}

export function useTransactionReportQuery(year: number, month: number) {
  return useQuery({
    queryKey: ['transactions-report', year, month],
    queryFn: () => api.transactions.list({ limit: '500' }),
  });
}

export function useTransactionDetailQuery(id: string) {
  return useQuery({
    queryKey: transactionDetailKey(id),
    queryFn: () => api.transactions.get(parseInt(id, 10)),
  });
}

export function useUpdateTransactionStatusMutation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: TransactionStatus) =>
      api.transactions.update(parseInt(id, 10), { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionDetailKey(id) }),
  });
}

export function useUpdateItemStatusMutation(txnId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, status }: { itemId: number; status: 'pending' | 'in_progress' | 'done' }) =>
      api.transactions.updateItem(parseInt(txnId, 10), itemId, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionDetailKey(txnId) }),
  });
}

export function useAddPaymentMutation(txnId: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ method, amount }: { method: PaymentMethod; amount: string }) =>
      api.transactions.addPayment(parseInt(txnId, 10), { method, amount }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: transactionDetailKey(txnId) });
      onSuccess?.();
    },
  });
}

export function useDeleteTransactionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.transactions.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
  });
}
