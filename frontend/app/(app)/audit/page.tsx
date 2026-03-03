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

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const now = new Date();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_YEAR = now.getFullYear();
const YEARS = Array.from({ length: 3 }, (_, i) => CURRENT_YEAR - i);

export default function AuditPage() {
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [performedBy, setPerformedBy] = useState<string | undefined>();

  const hasActiveFilter = month !== CURRENT_MONTH || year !== CURRENT_YEAR || !!performedBy;

  function clearAll() {
    setMonth(CURRENT_MONTH);
    setYear(CURRENT_YEAR);
    setPerformedBy(undefined);
  }

  const { data: entries = [], isLoading } = useAuditQuery({ month, year, performedBy });
  const { data: users = [] } = useUsersQuery();

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="All system actions" />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v, 10))}>
          <SelectTrigger className="h-9 text-sm w-36 border-zinc-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((name, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v, 10))}>
          <SelectTrigger className="h-9 text-sm w-24 border-zinc-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={performedBy ?? 'all'} onValueChange={(v) => setPerformedBy(v === 'all' ? undefined : v)}>
          <SelectTrigger className="h-9 text-sm w-44 border-zinc-200">
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
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
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
      />
    </div>
  );
}
