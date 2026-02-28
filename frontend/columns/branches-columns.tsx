'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { PencilSimpleIcon, CheckIcon, XIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { Branch } from '@/lib/types';

interface EditForm {
  name: string;
  address: string;
  phone: string;
}

interface BranchesColumnsOptions {
  editId: number | null;
  form: EditForm;
  setForm: (updater: (f: EditForm) => EditForm) => void;
  onUpdate: () => void;
  onCancelEdit: () => void;
  onStartEdit: (b: Branch) => void;
  onToggle: (id: number, isActive: boolean) => void;
  isSaving: boolean;
}

export const createBranchesColumns = ({
  editId,
  form,
  setForm,
  onUpdate,
  onCancelEdit,
  onStartEdit,
  onToggle,
  isSaving,
}: BranchesColumnsOptions): ColumnDef<Branch>[] => [
  {
    accessorKey: 'name',
    header: 'Branch Name',
    cell: ({ row }) => {
      const b = row.original;
      if (editId === b.id) {
        return (
          <input
            autoFocus
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') onUpdate(); if (e.key === 'Escape') onCancelEdit(); }}
            className="w-full px-2 py-1 text-sm border border-zinc-200 rounded focus:outline-none focus:border-blue-500"
          />
        );
      }
      return (
        <span className={cn('font-medium text-sm', b.isActive ? 'text-zinc-950' : 'text-zinc-400 line-through')}>
          {b.name}
        </span>
      );
    },
  },
  {
    accessorKey: 'address',
    header: 'Address',
    cell: ({ row }) => {
      const b = row.original;
      if (editId === b.id) {
        return (
          <input
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') onUpdate(); if (e.key === 'Escape') onCancelEdit(); }}
            placeholder="Branch address..."
            className="w-full px-2 py-1 text-sm border border-zinc-200 rounded focus:outline-none focus:border-blue-500"
          />
        );
      }
      return (
        <span className="text-sm text-zinc-500">{b.address ?? <span className="text-zinc-300">—</span>}</span>
      );
    },
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => {
      const b = row.original;
      if (editId === b.id) {
        return (
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') onUpdate(); if (e.key === 'Escape') onCancelEdit(); }}
            placeholder="Phone number..."
            className="w-full px-2 py-1 text-sm border border-zinc-200 rounded font-mono focus:outline-none focus:border-blue-500"
          />
        );
      }
      return (
        <span className="text-sm font-mono text-zinc-500">{b.phone ?? <span className="text-zinc-300">—</span>}</span>
      );
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => {
      const b = row.original;
      if (editId === b.id) return null;
      return (
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
            b.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-400',
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
      if (editId === b.id) {
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={onUpdate}
              disabled={!form.name.trim() || isSaving}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-40"
            >
              <CheckIcon size={14} weight="bold" />
            </button>
            <button
              onClick={onCancelEdit}
              className="p-1.5 text-zinc-400 hover:bg-zinc-100 rounded transition-colors"
            >
              <XIcon size={14} />
            </button>
          </div>
        );
      }
      return (
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onToggle(b.id, !b.isActive)}
            disabled={isSaving}
            className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded transition-colors disabled:opacity-40"
          >
            {b.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => onStartEdit(b)}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded transition-colors"
          >
            <PencilSimpleIcon size={13} />
          </button>
        </div>
      );
    },
  },
];
