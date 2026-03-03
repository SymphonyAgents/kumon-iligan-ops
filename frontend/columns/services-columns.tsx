'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { TrashIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import { formatPeso } from '@/lib/utils';
import { toTitleCase } from '@/utils/text';
import type { Service } from '@/lib/types';

interface ServicesColumnsOptions {
  onStartEdit: (s: Service) => void;
  onDelete: (s: Service) => void;
}

export const createServicesColumns = ({
  onStartEdit,
  onDelete,
}: ServicesColumnsOptions): ColumnDef<Service>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const s = row.original;
      return (
        <span className={`font-medium ${s.isActive ? 'text-zinc-950' : 'text-zinc-400 line-through'}`}>
          {toTitleCase(s.name)}
        </span>
      );
    },
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <span className="text-xs text-zinc-400">
        {row.original.type === 'primary' ? 'Primary' : 'Add-on'}
      </span>
    ),
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => (
      <span className="font-mono text-zinc-700">{formatPeso(row.original.price)}</span>
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const s = row.original;
      return (
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => onStartEdit(s)}
            className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded transition-colors"
          >
            <PencilSimpleIcon size={16} />
          </button>
          <button
            onClick={() => onDelete(s)}
            className="p-2 text-red-500 bg-red-50 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
          >
            <TrashIcon size={16} />
          </button>
        </div>
      );
    },
  },
];
