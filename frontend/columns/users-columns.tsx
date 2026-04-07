'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { TrashIcon, PencilSimpleIcon, CheckCircleIcon, XCircleIcon } from '@phosphor-icons/react';
import { formatDatetime, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { toTitleCase } from '@/utils/text';
import { USER_TYPE, USER_TYPE_LABELS, USER_TYPE_STYLES } from '@/lib/constants';
import type { AppUser, Branch } from '@/lib/types';

const ROLES = [USER_TYPE.TEACHER, USER_TYPE.ADMIN, USER_TYPE.SUPERADMIN] as const;

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide',
      USER_TYPE_STYLES[role] ?? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
    )}>
      {USER_TYPE_LABELS[role] ?? role}
    </span>
  );
}

interface UserColumnsOptions {
  onRoleChange: (id: string, newUserType: string, currentUserType: string, email: string) => void;
  onBranchChange?: (id: string, newBranchId: string, currentBranchId: string | null, email: string, newBranchName: string, currentBranchName: string | null) => void;
  onDelete?: (user: AppUser) => void;
  onEdit?: (user: AppUser) => void;
  onApprove?: (user: AppUser) => void;
  onReject?: (user: AppUser) => void;
  currentUserId?: string;
  isSuperadmin?: boolean;
  branches?: Branch[];
}

export const createUserColumns = ({
  onRoleChange,
  onBranchChange,
  onDelete,
  onEdit,
  onApprove,
  onReject,
  currentUserId,
  isSuperadmin,
  branches = [],
}: UserColumnsOptions): ColumnDef<AppUser>[] => [
  {
    accessorKey: 'email',
    header: 'User',
    cell: ({ row }) => {
      const u = row.original;
      const name = u.fullName ?? u.nickname ?? null;
      const primary = name ? toTitleCase(name) : u.email;
      return <span className="text-sm text-zinc-950 dark:text-zinc-50">{primary}</span>;
    },
  },
  {
    accessorKey: 'userType',
    header: 'Role',
    size: 160,
    cell: ({ row }) => {
      const user = row.original;
      const isSelf = user.id === currentUserId;
      const isPending = user.status === 'pending';
      return (
        <div className="flex items-center">
          {isSelf || isPending ? (
            <RoleBadge role={user.userType} />
          ) : (
            <Select value={user.userType} onValueChange={(v) => onRoleChange(user.id, v, user.userType, user.email)}>
              <SelectTrigger className="h-auto border-0 bg-transparent shadow-none p-0 gap-1.5 focus-visible:ring-0 w-auto">
                <RoleBadge role={user.userType} />
              </SelectTrigger>
              <SelectContent position="popper">
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    <RoleBadge role={r} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      );
    },
  },
  {
    id: 'branch',
    header: 'Branch',
    size: 180,
    cell: ({ row }) => {
      const user = row.original;
      const isSelf = user.id === currentUserId;
      const currentBranch = branches.find((b) => b.id === user.branchId) ?? null;

      if (isSelf || !isSuperadmin || !onBranchChange || user.status === 'pending') {
        return (
          <span className={cn('text-sm', currentBranch ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-500')}>
            {toTitleCase(currentBranch?.name) || 'No branch'}
          </span>
        );
      }

      return (
        <Select
          value={user.branchId !== null ? String(user.branchId) : ''}
          onValueChange={(v) => {
            const newBranch = branches.find((b) => b.id === v);
            if (!newBranch) return;
            onBranchChange(user.id, v, user.branchId, user.email, newBranch.name, currentBranch?.name ?? null);
          }}
        >
          <SelectTrigger className="h-auto border-0 bg-transparent shadow-none p-0 gap-1.5 focus-visible:ring-0 w-auto text-sm text-zinc-700 dark:text-zinc-300">
            <span className={cn('text-sm', currentBranch ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-500')}>
              {toTitleCase(currentBranch?.name) || 'No branch'}
            </span>
          </SelectTrigger>
          <SelectContent position="popper">
            {branches.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>
                {toTitleCase(b.name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Joined',
    size: 200,
    cell: ({ row }) => (
      <span className="text-xs text-zinc-400">{formatDatetime(row.original.createdAt)}</span>
    ),
  },
  {
    id: 'actions',
    header: '',
    size: 240,
    cell: ({ row }) => {
      const user = row.original;
      const isSelf = user.id === currentUserId;
      const isPending = user.status === 'pending';
      return (
        <div className="flex items-center justify-end gap-3">
          {isPending && isSuperadmin && onApprove && (
            <button
              onClick={(e) => { e.stopPropagation(); onApprove(user); }}
              className="p-1.5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-md transition-colors"
              title="Approve"
            >
              <CheckCircleIcon size={22} weight="fill" />
            </button>
          )}
          {isPending && isSuperadmin && onReject && (
            <button
              onClick={(e) => { e.stopPropagation(); onReject(user); }}
              className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors"
              title="Reject"
            >
              <XCircleIcon size={22} weight="fill" />
            </button>
          )}

          {!isPending && onEdit && (
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => { e.stopPropagation(); onEdit(user); }}
            >
              <PencilSimpleIcon size={13} />
              Edit
            </Button>
          )}
          {!isSelf && !isPending && isSuperadmin && onDelete && (
            <Button
              size="sm"
              variant="danger"
              onClick={(e) => { e.stopPropagation(); onDelete(user); }}
            >
              <TrashIcon size={13} />
            </Button>
          )}
        </div>
      );
    },
  },
];
