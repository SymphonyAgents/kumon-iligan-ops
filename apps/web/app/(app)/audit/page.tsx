'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { auditColumns } from '@/columns/audit-columns';
import { useAuditQuery } from '@/hooks/useAuditQuery';
import { useUsersQuery } from '@/hooks/useUsersQuery';
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select';
import { MONTHS, AUDIT_TYPE_LABELS, AUDIT_TYPE_STYLES, ENTITY_LABELS, SOURCE_LABELS } from '@/lib/constants';
import { formatDatetime } from '@/lib/utils';
import { useUrlParam } from '@/hooks/useUrlParam';
import { toTitleCase } from '@/utils/text';

const now = new Date();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_YEAR = now.getFullYear();
const YEARS = Array.from({ length: 3 }, (_, i) => CURRENT_YEAR - i);

export default function AuditPage() {
 const [monthStr, setMonthStr] = useUrlParam('month', { defaultValue: String(CURRENT_MONTH) });
 const [yearStr, setYearStr] = useUrlParam('year', { defaultValue: String(CURRENT_YEAR) });
 const [performedByStr, setPerformedByStr] = useUrlParam('by');
 const month = parseInt(monthStr, 10) || CURRENT_MONTH;
 const year = parseInt(yearStr, 10) || CURRENT_YEAR;
 const performedBy = performedByStr || undefined;

 const hasActiveFilter = month !== CURRENT_MONTH || year !== CURRENT_YEAR || !!performedBy;

 function clearAll() {
 setMonthStr(String(CURRENT_MONTH));
 setYearStr(String(CURRENT_YEAR));
 setPerformedByStr('');
 }

 const { data: entries = [], isLoading } = useAuditQuery({ month, year, performedBy });
 const { data: users = [] } = useUsersQuery();

 return (
 <div>
 <PageHeader title="Audit Log"subtitle="All system actions" />

 <div className="flex flex-wrap items-center gap-2 mb-4">
 <Select value={String(month)} onValueChange={(v) => setMonthStr(v)}>
 <SelectTrigger className="h-9 text-sm w-36 border-border">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {MONTHS.map((name, i) => (
 <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
 ))}
 </SelectContent>
 </Select>

 <Select value={String(year)} onValueChange={(v) => setYearStr(v)}>
 <SelectTrigger className="h-9 text-sm w-24 border-border">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {YEARS.map((y) => (
 <SelectItem key={y} value={String(y)}>{y}</SelectItem>
 ))}
 </SelectContent>
 </Select>

 <Select value={performedBy ?? 'all'} onValueChange={(v) => setPerformedByStr(v === 'all' ? '' : v)}>
 <SelectTrigger className="h-9 text-sm w-44 border-border">
 <SelectValue placeholder="All users" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All users</SelectItem>
 {users.map((u) => (
 <SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>
 ))}
 </SelectContent>
 </Select>

 {hasActiveFilter && (
 <button
 onClick={clearAll}
 className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
 >
 Clear all
 </button>
 )}
 </div>

 <DataTable
 columns={auditColumns}
 data={entries}
 isLoading={isLoading}
 loadingRows={8}
 emptyTitle="No audit entries"
 emptyDescription="Actions will appear here."
 getRowKey={(e) => e.id}
 renderMobileCard={(entry) => {
 const eventLabel = entry.auditType && AUDIT_TYPE_LABELS[entry.auditType]
 ? AUDIT_TYPE_LABELS[entry.auditType]
 : entry.action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
 const eventStyle = entry.auditType && AUDIT_TYPE_STYLES[entry.auditType]
 ? AUDIT_TYPE_STYLES[entry.auditType]
 : 'bg-secondary text-muted-foreground';
 const entityLabel = ENTITY_LABELS[entry.entityType] ?? entry.entityType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
 const performer = entry.performedByFullName
 ? toTitleCase(entry.performedByFullName)
 : entry.performedByEmail ?? 'System';
 const sourceRaw = entry.source?.toLowerCase() ?? '';
 const sourceLabel = SOURCE_LABELS[sourceRaw] ?? (sourceRaw || '—');
 return {
 title: <span className="text-sm">{entityLabel}</span>,
 description: entry.entityId ? <span className="font-mono">#{entry.entityId}</span> : undefined,
 badge: (
 <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${eventStyle}`}>
 {eventLabel}
 </span>
 ),
 meta: (
 <>
 <p className="font-mono">{formatDatetime(entry.createdAt)}</p>
 <p>By {performer} · {sourceLabel}</p>
 </>
 ),
 };
 }}
 />
 </div>
 );
}
