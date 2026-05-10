'use client';

import { ArrowRightIcon } from '@phosphor-icons/react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export interface PendingBranchChange {
 id: string;
 email: string;
 currentBranchName: string | null;
 newBranchId: string;
 newBranchName: string;
}

interface UserBranchConfirmDialogProps {
 open: boolean;
 pendingChange: PendingBranchChange | null;
 loading: boolean;
 onConfirm: () => void;
 onCancel: () => void;
}

export function UserBranchConfirmDialog({
 open,
 pendingChange,
 loading,
 onConfirm,
 onCancel,
}: UserBranchConfirmDialogProps) {
 return (
 <ConfirmDialog
 open={open}
 title="Change user branch?"
 confirmLabel="Update Branch"
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
 <span className="text-muted-foreground">Branch</span>
 <div className="flex items-center gap-2">
 <span className="text-muted-foreground text-xs">{pendingChange.currentBranchName ?? 'None'}</span>
 <ArrowRightIcon size={12} className="text-muted-foreground" />
 <span className="font-medium text-foreground text-xs">{pendingChange.newBranchName}</span>
 </div>
 </div>
 </div>
 )}
 </ConfirmDialog>
 );
}
