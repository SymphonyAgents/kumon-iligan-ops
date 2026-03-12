'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { formatDatetime, formatAddress } from '@/lib/utils';
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
    id: 'address',
    header: 'Address',
    cell: ({ row }) => {
      const c = row.original;
      const addr = formatAddress({ streetName: c.streetName, city: c.city });
      return <span className="text-sm text-zinc-500">{addr}</span>;
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => (
      <span className="text-sm text-zinc-500">{row.original.email ?? '—'}</span>
    ),
  },
  {
    accessorKey: 'shoesCount',
    header: () => <span className="block text-right">Shoes</span>,
    cell: ({ row }) => (
      <span className="block text-right font-mono text-sm text-zinc-950">
        {row.original.shoesCount ?? 0}
      </span>
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
