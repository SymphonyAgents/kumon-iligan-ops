'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { TrashIcon, ReceiptIcon } from '@phosphor-icons/react';
import { formatPeso } from '@/lib/utils';
import { toTitleCase } from '@/utils/text';
import type { Expense } from '@/lib/types';

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
