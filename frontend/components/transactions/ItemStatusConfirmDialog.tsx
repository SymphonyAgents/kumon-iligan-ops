'use client';

import { ArrowRightIcon } from '@phosphor-icons/react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { StatusBadge } from '@/components/ui/status-badge';
import { toTitleCase } from '@/utils/text';
import type { ItemStatus } from '@/lib/types';

export interface PendingItemChange {
  itemId: number;
  newStatus: ItemStatus;
  currentStatus: string;
  shoeDescription: string;
  serviceName: string;
}

interface ItemStatusConfirmDialogProps {
  open: boolean;
  pendingChange: PendingItemChange | null;
  customerName: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ItemStatusConfirmDialog({
  open,
  pendingChange,
  customerName,
  loading,
  onConfirm,
  onCancel,
}: ItemStatusConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title="Change item status?"
      confirmLabel="Update Status"
      confirmVariant="dark"
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      {pendingChange && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Customer</span>
            <span className="text-zinc-950">{toTitleCase(customerName) || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Shoe</span>
            <span className="text-zinc-950">{toTitleCase(pendingChange.shoeDescription) || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Service</span>
            <span className="text-zinc-950">{pendingChange.serviceName || '—'}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-500">Status</span>
            <div className="flex items-center gap-2">
              <StatusBadge status={pendingChange.currentStatus} />
              <ArrowRightIcon size={12} className="text-zinc-400" />
              <StatusBadge status={pendingChange.newStatus} />
            </div>
          </div>
        </div>
      )}
    </ConfirmDialog>
  );
}
