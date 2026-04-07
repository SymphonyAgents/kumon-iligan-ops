'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { usePaymentPeriodsQuery, useBulkGeneratePeriodsMutation, useDeletePeriodMutation } from '@/hooks/usePaymentPeriodsQuery';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import { useBranchesQuery } from '@/hooks/useBranchesQuery';
import { PERIOD_STATUS, MONTHS, USER_TYPE } from '@/lib/constants';
import type { PaymentPeriod } from '@/lib/types';
import { SparkleIcon, TrashIcon } from '@phosphor-icons/react';

// ---- Bulk Generate Dialog ----
function BulkGenerateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [expectedAmount, setExpectedAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [branchId, setBranchId] = useState('');

  const { data: currentUser } = useCurrentUserQuery();
  const { data: branches = [] } = useBranchesQuery();
  const isSuperadmin = currentUser?.userType === USER_TYPE.SUPERADMIN;

  const bulkMut = useBulkGeneratePeriodsMutation(() => {
    onClose();
    setExpectedAmount(''); setDueDate('');
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!month || !year || !expectedAmount || !dueDate) return;
    bulkMut.mutate({
      periodMonth: parseInt(month),
      periodYear: parseInt(year),
      expectedAmount: Math.round(parseFloat(expectedAmount) * 100),
      dueDate,
      branchId: branchId || undefined,
    });
  }

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 1 + i);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Bulk Generate Periods</DialogTitle></DialogHeader>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 -mt-1">
          Creates a payment period for every active student who doesn&apos;t already have one for this month.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Month *</label>
              <select
                value={month}
                onChange={e => setMonth(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Year *</label>
              <select
                value={year}
                onChange={e => setYear(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Expected Amount (₱) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={expectedAmount}
              onChange={e => setExpectedAmount(e.target.value)}
              placeholder="e.g. 2500.00"
              required
              className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Due Date *</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {isSuperadmin && branches.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Branch (optional — all if blank)</label>
              <select
                value={branchId}
                onChange={e => setBranchId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">All branches</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={bulkMut.isPending}>
              {bulkMut.isPending ? 'Generating…' : 'Generate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---- Main Page ----
export default function PaymentPeriodsPage() {
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(String(now.getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(now.getFullYear()));
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PaymentPeriod | null>(null);

  const { data: currentUser } = useCurrentUserQuery();
  const isAdmin = currentUser?.userType === USER_TYPE.ADMIN || currentUser?.userType === USER_TYPE.SUPERADMIN;

  const { data: periods = [], isLoading } = usePaymentPeriodsQuery({
    periodMonth: filterMonth ? parseInt(filterMonth) : undefined,
    periodYear: filterYear ? parseInt(filterYear) : undefined,
    status: filterStatus || undefined,
  });

  const deleteMut = useDeletePeriodMutation(() => setDeleteTarget(null));

  const filtered = useMemo(() => {
    if (!search.trim()) return periods;
    const q = search.toLowerCase();
    return periods.filter(p =>
      `${p.studentFirstName ?? ''} ${p.studentLastName ?? ''}`.toLowerCase().includes(q)
    );
  }, [periods, search]);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const statuses = [
    { label: 'All', value: '' },
    { label: 'Pending', value: PERIOD_STATUS.PENDING },
    { label: 'Partial', value: PERIOD_STATUS.PARTIAL },
    { label: 'Paid', value: PERIOD_STATUS.PAID },
    { label: 'Overdue', value: PERIOD_STATUS.OVERDUE },
  ];

  return (
    <div>
      <PageHeader
        title="Payment Periods"
        subtitle="Monthly tuition billing cycles"
        action={
          isAdmin ? (
            <Button onClick={() => setShowBulk(true)}>
              <SparkleIcon weight="bold" size={14} />
              Bulk Generate
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-2">
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All months</option>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex-wrap">
          {statuses.map(s => (
            <button
              key={s.value}
              onClick={() => setFilterStatus(s.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterStatus === s.value
                  ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search student…"
          className="flex-1 px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No periods found" description="Use Bulk Generate to create periods for all active students." />
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">Student</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">Period</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">Expected</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">Paid</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">Balance</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden md:table-cell">Due</th>
                  {isAdmin && <th className="text-right px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filtered.map(p => {
                  const balance = p.expectedAmount - p.paidAmount;
                  const isOverdue = p.status === PERIOD_STATUS.OVERDUE;
                  return (
                    <tr key={p.id} className="bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                        {p.studentFirstName} {p.studentLastName}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                        {MONTHS[p.periodMonth - 1]} {p.periodYear}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">
                        ₱{(p.expectedAmount / 100).toLocaleString('en-PH')}
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell text-zinc-600 dark:text-zinc-400">
                        ₱{(p.paidAmount / 100).toLocaleString('en-PH')}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium hidden sm:table-cell ${balance > 0 ? (isOverdue ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400') : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {balance > 0 ? `₱${(balance / 100).toLocaleString('en-PH')}` : '—'}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 hidden md:table-cell text-zinc-500 dark:text-zinc-400 text-xs">
                        {new Date(p.dueDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          {currentUser?.userType === USER_TYPE.SUPERADMIN && (
                            <button
                              onClick={() => setDeleteTarget(p)}
                              className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-red-500 transition-colors"
                            >
                              <TrashIcon size={14} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <BulkGenerateDialog open={showBulk} onClose={() => setShowBulk(false)} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Period"
        description={`Delete ${deleteTarget ? `${MONTHS[deleteTarget.periodMonth - 1]} ${deleteTarget.periodYear}` : ''} period for ${deleteTarget?.studentFirstName} ${deleteTarget?.studentLastName}? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
