'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { TrashIcon, ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import { cn, formatAddress } from '@/lib/utils';
import type { Branch } from '@/lib/types';

interface BranchesColumnsOptions {
  onDelete: (b: Branch) => void;
  onActivate: (b: Branch) => void;
}

export const createBranchesColumns = ({
  onDelete,
  onActivate,
}: BranchesColumnsOptions): ColumnDef<Branch>[] => [
  {
    accessorKey: 'name',
    header: 'Branch Name',
    cell: ({ row }) => {
      const b = row.original;
      return (
        <span className={cn('font-medium text-sm capitalize', b.isActive ? 'text-zinc-950' : 'text-zinc-400 line-through')}>
          {b.name}
        </span>
      );
    },
  },
  {
    id: 'address',
    header: 'Address',
    cell: ({ row }) => {
      const b = row.original;
      const addr = formatAddress({ streetName: b.streetName, barangay: b.barangay, city: b.city, province: b.province });
      return (
        <span className="text-sm text-zinc-500">
          {addr === '—' ? <span className="text-zinc-300">—</span> : addr}
        </span>
      );
    },
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => (
      <span className="text-sm font-mono text-zinc-500">{row.original.phone ?? <span className="text-zinc-300">—</span>}</span>
    ),
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => {
      const b = row.original;
      return (
        <span className={cn(
          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
          b.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-400',
        )}>
          {b.isActive ? 'Active' : 'Inactive'}
        </span>
      );
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const b = row.original;
      return (
        <div className="flex items-center justify-end gap-1">
          {b.isActive ? (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(b); }}
              className="p-2 text-red-500 bg-red-50 hover:text-red-600 hover:bg-red-100 rounded transition-all"
              title="Deactivate branch"
            >
              <TrashIcon size={16} />
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onActivate(b); }}
              className="p-2 text-emerald-600 bg-emerald-50 hover:text-emerald-700 hover:bg-emerald-100 rounded transition-all"
              title="Reactivate branch"
            >
              <ArrowCounterClockwiseIcon size={16} />
            </button>
          )}
        </div>
      );
    },
  },
];
