'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { formatDatetime } from '@/lib/utils';
import type { Customer } from '@/lib/types';

export const customerColumns: ColumnDef<Customer>[] = [
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-zinc-950">{row.original.phone}</span>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <span className="text-sm text-zinc-950 capitalize">{row.original.name ?? '—'}</span>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => (
      <span className="text-sm text-zinc-500">{row.original.email ?? '—'}</span>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Registered',
    cell: ({ row }) => (
      <span className="text-xs text-zinc-400">{formatDatetime(row.original.createdAt)}</span>
    ),
  },
];
