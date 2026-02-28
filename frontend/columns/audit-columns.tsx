'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { formatDatetime } from '@/lib/utils';
import type { AuditEntry } from '@/lib/types';

const AUDIT_TYPE_LABELS: Record<string, string> = {
  TRANSACTION_CREATED: 'Transaction Created',
  TRANSACTION_UPDATED: 'Transaction Updated',
  PICKUP_RESCHEDULED: 'Pickup Rescheduled',
  TRANSACTION_STATUS_CHANGED: 'Status Changed',
  TRANSACTION_CLAIMED: 'Transaction Claimed',
  TRANSACTION_CANCELLED: 'Transaction Cancelled',
  ITEM_STATUS_CHANGED: 'Item Status Changed',
  PAYMENT_ADDED: 'Payment Added',
  EXPENSE_CREATED: 'Expense Logged',
  SERVICE_UPDATED: 'Service Updated',
};

const AUDIT_TYPE_STYLES: Record<string, string> = {
  TRANSACTION_CREATED: 'bg-emerald-50 text-emerald-700',
  EXPENSE_CREATED: 'bg-emerald-50 text-emerald-700',
  PAYMENT_ADDED: 'bg-violet-50 text-violet-700',
  PICKUP_RESCHEDULED: 'bg-amber-50 text-amber-700',
  TRANSACTION_CANCELLED: 'bg-red-50 text-red-700',
  TRANSACTION_CLAIMED: 'bg-blue-50 text-blue-700',
  TRANSACTION_STATUS_CHANGED: 'bg-blue-50 text-blue-700',
  ITEM_STATUS_CHANGED: 'bg-blue-50 text-blue-700',
  TRANSACTION_UPDATED: 'bg-zinc-100 text-zinc-600',
  SERVICE_UPDATED: 'bg-zinc-100 text-zinc-600',
};

const ENTITY_LABELS: Record<string, string> = {
  transaction: 'Transaction',
  transaction_item: 'Item',
  service: 'Service',
  promo: 'Promo',
  expense: 'Expense',
};

const SOURCE_LABELS: Record<string, string> = {
  pos: 'POS',
  admin: 'Admin',
};

function getEventLabel(entry: AuditEntry): string {
  if (entry.auditType && AUDIT_TYPE_LABELS[entry.auditType]) {
    return AUDIT_TYPE_LABELS[entry.auditType];
  }
  return entry.action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getEventStyle(entry: AuditEntry): string {
  if (entry.auditType && AUDIT_TYPE_STYLES[entry.auditType]) {
    return AUDIT_TYPE_STYLES[entry.auditType];
  }
  return 'bg-zinc-100 text-zinc-600';
}

export const auditColumns: ColumnDef<AuditEntry>[] = [
  {
    accessorKey: 'createdAt',
    header: 'When',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-zinc-400 whitespace-nowrap">
        {formatDatetime(row.original.createdAt)}
      </span>
    ),
  },
  {
    accessorKey: 'auditType',
    header: 'Event',
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${getEventStyle(row.original)}`}
      >
        {getEventLabel(row.original)}
      </span>
    ),
  },
  {
    accessorKey: 'entityType',
    header: 'On',
    cell: ({ row }) => {
      const { entityType, entityId } = row.original;
      const label = ENTITY_LABELS[entityType] ?? entityType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return (
        <div>
          <span className="text-sm text-zinc-700">{label}</span>
          {entityId && (
            <span className="block font-mono text-xs text-zinc-400">#{entityId}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'performedByEmail',
    header: 'By',
    cell: ({ row }) => {
      const email = row.original.performedByEmail;
      if (!email) {
        return <span className="text-xs text-zinc-400">System</span>;
      }
      const [user, domain] = email.split('@');
      return (
        <div>
          <span className="text-sm text-zinc-700">{user}</span>
          {domain && (
            <span className="block text-xs text-zinc-400">@{domain}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'source',
    header: 'Via',
    cell: ({ row }) => {
      const raw = row.original.source?.toLowerCase() ?? '';
      const label = SOURCE_LABELS[raw] ?? (raw || '—');
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-500">
          {label}
        </span>
      );
    },
  },
];
