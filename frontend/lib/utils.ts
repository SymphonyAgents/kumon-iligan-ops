import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPeso(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDatetime(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  done: 'Done',
  claimed: 'Claimed',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: 'text-blue-600 bg-blue-50',
  in_progress: 'text-amber-600 bg-amber-50',
  done: 'text-emerald-600 bg-emerald-50',
  claimed: 'text-zinc-500 bg-zinc-100',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  gcash: 'GCash',
  card: 'Card',
  bank_deposit: 'Bank Deposit',
};
