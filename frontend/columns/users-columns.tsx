'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { formatDatetime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { AppUser } from '@/lib/types';

const ROLES = ['staff', 'admin', 'superadmin'] as const;

const ROLE_STYLES: Record<string, string> = {
  staff: 'bg-zinc-100 text-zinc-600',
  admin: 'bg-blue-50 text-blue-600',
  superadmin: 'bg-violet-50 text-violet-700',
};

interface UserColumnsOptions {
  onRoleChange: (id: string, userType: string) => void;
  currentUserId?: string;
}

export const createUserColumns = ({ onRoleChange, currentUserId }: UserColumnsOptions): ColumnDef<AppUser>[] => [
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-950">{row.original.email}</span>
        {row.original.id === currentUserId && (
          <span className="text-xs text-zinc-400">(you)</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'userType',
    header: 'Role',
    cell: ({ row }) => {
      const user = row.original;
      const isSelf = user.id === currentUserId;
      return (
        <div className="flex items-center gap-2">
          {isSelf ? (
            <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide', ROLE_STYLES[user.userType] ?? 'bg-zinc-100 text-zinc-600')}>
              {user.userType}
            </span>
          ) : (
            <select
              value={user.userType}
              onChange={(e) => onRoleChange(user.id, e.target.value)}
              className="text-xs font-medium border border-zinc-200 rounded px-2 py-1 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Joined',
    cell: ({ row }) => (
      <span className="text-xs text-zinc-400">{formatDatetime(row.original.createdAt)}</span>
    ),
  },
];
