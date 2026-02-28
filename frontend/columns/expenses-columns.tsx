'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { TrashIcon, ReceiptIcon } from '@phosphor-icons/react';
import { formatPeso, PAYMENT_METHOD_LABELS } from '@/lib/utils';
import { toTitleCase } from '@/utils/text';
import type { Expense } from '@/lib/types';

const METHOD_STYLES: Record<string, string> = {
  cash: 'bg-emerald-50 text-emerald-700',
  gcash: 'bg-blue-50 text-blue-700',
  card: 'bg-violet-50 text-violet-700',
  bank_deposit: 'bg-amber-50 text-amber-700',
};

interface ExpenseColumnsOptions {
  onDelete: (expense: Expense) => void;
}

export const createExpenseColumns = ({ onDelete }: ExpenseColumnsOptions): ColumnDef<Expense>[] => [
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <ReceiptIcon size={13} className="text-zinc-400 shrink-0" />
        <span className="font-medium text-zinc-950">{toTitleCase(row.original.category) || '—'}</span>
      </div>
    ),
  },
  {
    accessorKey: 'note',
    header: 'Note',
    cell: ({ row }) => (
      <span className="text-zinc-500">{toTitleCase(row.original.note) || '—'}</span>
    ),
  },
  {
    accessorKey: 'method',
    header: 'Method',
    cell: ({ row }) => {
      const m = row.original.method;
      if (!m) return <span className="text-xs text-zinc-400">—</span>;
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${METHOD_STYLES[m] ?? 'bg-zinc-100 text-zinc-500'}`}>
          {PAYMENT_METHOD_LABELS[m] ?? m}
        </span>
      );
    },
  },
  {
    accessorKey: 'amount',
    header: () => <span className="block text-right">Amount</span>,
    cell: ({ row }) => (
      <span className="block text-right font-mono text-zinc-950">{formatPeso(row.original.amount)}</span>
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(row.original); }}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-500 rounded transition-all"
      >
        <TrashIcon size={14} />
      </button>
    ),
  },
];
