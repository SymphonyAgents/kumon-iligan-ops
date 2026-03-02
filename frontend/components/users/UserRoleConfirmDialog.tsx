'use client';

import { ArrowRightIcon } from '@phosphor-icons/react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';

const ROLE_STYLES: Record<string, string> = {
  staff: 'bg-zinc-100 text-zinc-600',
  admin: 'bg-blue-50 text-blue-600',
  superadmin: 'bg-violet-50 text-violet-700',
};

export interface PendingRoleChange {
  id: string;
  email: string;
  currentRole: string;
  newRole: string;
}

interface UserRoleConfirmDialogProps {
  open: boolean;
  pendingChange: PendingRoleChange | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UserRoleConfirmDialog({
  open,
  pendingChange,
  loading,
  onConfirm,
  onCancel,
}: UserRoleConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title="Change user role?"
      confirmLabel="Update Role"
      confirmVariant="dark"
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      {pendingChange && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">User</span>
            <span className="text-zinc-950 truncate max-w-[200px]">{pendingChange.email}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-500">Role</span>
            <div className="flex items-center gap-2">
              <span className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide',
                ROLE_STYLES[pendingChange.currentRole] ?? 'bg-zinc-100 text-zinc-600',
              )}>
                {pendingChange.currentRole}
              </span>
              <ArrowRightIcon size={12} className="text-zinc-400" />
              <span className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide',
                ROLE_STYLES[pendingChange.newRole] ?? 'bg-zinc-100 text-zinc-600',
              )}>
                {pendingChange.newRole}
              </span>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialog>
  );
}
