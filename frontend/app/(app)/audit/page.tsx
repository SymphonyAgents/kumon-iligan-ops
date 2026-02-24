'use client';

import { formatDatetime } from '@/lib/utils';
import { useAuditQuery } from '@/hooks/useAuditQuery';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import type { AuditEntry } from '@/lib/types';

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-emerald-50 text-emerald-700',
  update: 'bg-blue-50 text-blue-700',
  delete: 'bg-red-50 text-red-700',
  status_change: 'bg-amber-50 text-amber-700',
  payment_add: 'bg-violet-50 text-violet-700',
};

export default function AuditPage() {
  const { data: entries = [], isLoading } = useAuditQuery();

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="All system actions" />

      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Entity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Ref
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Source
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-zinc-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (entries as AuditEntry[]).length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState title="No audit entries" description="Actions will appear here." />
                </td>
              </tr>
            ) : (
              (entries as AuditEntry[]).map((e) => (
                <tr key={e.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                    {formatDatetime(e.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        ACTION_COLORS[e.action] ?? 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {e.action.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 capitalize">{e.entityType}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{e.entityId ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-zinc-400 capitalize">{e.source ?? '—'}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
