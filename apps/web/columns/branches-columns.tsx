'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { TrashIcon, ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import { cn, formatAddress } from '@/lib/utils';
import { toTitleCase } from '@/utils/text';
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
        <span
          className={cn(
            'font-medium text-sm',
            b.isActive ? 'text-foreground' : 'text-muted-foreground line-through',
          )}
        >
          {toTitleCase(b.name)}
        </span>
      );
    },
  },
  {
    id: 'address',
    header: 'Address',
    cell: ({ row }) => {
      const b = row.original;
      const addr = formatAddress({
        streetName: b.streetName,
        barangay: b.barangay,
        city: b.city,
        province: b.province,
      });
      return (
        <span className="text-sm text-muted-foreground">
          {addr === '—' ? <span className="text-muted-foreground/60">—</span> : toTitleCase(addr)}
        </span>
      );
    },
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => (
      <span className="text-sm font-mono text-muted-foreground">
        {row.original.phone ?? <span className="text-muted-foreground/60">—</span>}
      </span>
    ),
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => {
      const b = row.original;
      return (
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
            b.isActive
              ? 'bg-status-paid-bg text-status-paid-fg'
              : 'bg-secondary text-muted-foreground',
          )}
        >
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
              onClick={(e) => {
                e.stopPropagation();
                onDelete(b);
              }}
              className="p-2 text-err bg-err-soft hover:bg-err/15 rounded transition-all"
              title="Deactivate branch"
            >
              <TrashIcon size={16} />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onActivate(b);
              }}
              className="p-2 text-status-paid-fg bg-status-paid-bg hover:bg-status-paid-bg/80 rounded transition-all"
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
