'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { formatDatetime } from '@/lib/utils';
import { toTitleCase } from '@/utils/text';
import {
  AUDIT_TYPE_LABELS,
  AUDIT_TYPE_STYLES,
  ENTITY_LABELS,
  SOURCE_LABELS,
} from '@/lib/constants';
import type { AuditEntry } from '@/lib/types';

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
  return 'bg-secondary text-muted-foreground';
}

export const auditColumns: ColumnDef<AuditEntry>[] = [
  {
    accessorKey: 'createdAt',
    header: 'When',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
        {formatDatetime(row.original.createdAt)}
      </span>
    ),
  },
  {
    accessorKey: 'auditType',
    header: 'Event',
    cell: ({ row }) => {
      const entry = row.original;
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${getEventStyle(entry)}`}
        >
          {getEventLabel(entry)}
        </span>
      );
    },
  },
  {
    accessorKey: 'entityType',
    header: 'On',
    cell: ({ row }) => {
      const { entityType, entityId } = row.original;
      const label = ENTITY_LABELS[entityType] ?? entityType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return (
        <div>
          <span className="text-sm text-foreground">{label}</span>
          {entityId && (
            <span className="block font-mono text-xs text-muted-foreground">#{entityId}</span>
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
      const fullName = row.original.performedByFullName;
      if (!email) {
        return <span className="text-xs text-muted-foreground">System</span>;
      }
      const [user, domain] = email.split('@');
      return (
        <div>
          <span className="text-sm text-foreground">
            {fullName ? toTitleCase(fullName) : user}
          </span>
          <span className="block text-xs text-muted-foreground">@{domain ?? '—'}</span>
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
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-muted-foreground">
          {label}
        </span>
      );
    },
  },
];
