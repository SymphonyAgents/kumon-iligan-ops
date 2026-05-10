'use client';

import { ArrowRightIcon } from '@phosphor-icons/react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import { USER_TYPE_STYLES, USER_TYPE_LABELS } from '@/lib/constants';

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
 <span className="text-muted-foreground">User</span>
 <span className="text-foreground truncate max-w-[200px]">{pendingChange.email}</span>
 </div>
 <div className="flex justify-between items-center text-sm">
 <span className="text-muted-foreground">Role</span>
 <div className="flex items-center gap-2">
 <span className={cn(
 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide',
 USER_TYPE_STYLES[pendingChange.currentRole] ?? 'bg-secondary text-foreground dark:bg-secondary ',
 )}>
 {USER_TYPE_LABELS[pendingChange.currentRole] ?? pendingChange.currentRole}
 </span>
 <ArrowRightIcon size={12} className="text-muted-foreground" />
 <span className={cn(
 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide',
 USER_TYPE_STYLES[pendingChange.newRole] ?? 'bg-secondary text-foreground dark:bg-secondary ',
 )}>
 {USER_TYPE_LABELS[pendingChange.newRole] ?? pendingChange.newRole}
 </span>
 </div>
 </div>
 </div>
 )}
 </ConfirmDialog>
 );
}
