'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { DataCardList } from '@/components/ui/data-card-list';
import { fullName } from '@/utils/text';
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
 periodMonth: parseInt(month), periodYear: parseInt(year), expectedAmount: Math.round(parseFloat(expectedAmount) * 100),
 dueDate,
 branchId: branchId || undefined,
 });
 }

 const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 1 + i);

 return (
 <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
 <DialogContent className="max-w-sm">
 <DialogHeader><DialogTitle>Bulk Generate Periods</DialogTitle></DialogHeader>
 <p className="text-xs text-muted-foreground -mt-1">
 Creates a payment period for every active student who doesn&apos;t already have one for this month.
 </p>
 <form onSubmit={handleSubmit}  className="flex flex-col gap-4 mt-2">
 <div className="grid grid-cols-2 gap-3">
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-medium text-foreground">Month *</label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground">Year *</label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{String(y)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
 </div>
 </div>

 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-medium text-foreground">Expected Amount (₱) *</label>
 <input
 type="number"
 min="0"
 step="0.01"
 value={expectedAmount}
 onChange={e => setExpectedAmount(e.target.value)}
 placeholder="e.g. 2500.00"
 required
 className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
 />
 </div>

 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-medium text-foreground">Due Date *</label>
          <DatePicker value={dueDate} onChange={setDueDate} placeholder="Pick due date" />
 </div>

 {isSuperadmin && branches.length > 1 && (
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-medium text-foreground">Branch (optional — all if blank)</label>
          <Select
            value={branchId || '__all__'}
            onValueChange={(v) => setBranchId(v === '__all__' ? '' : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Select
            value={filterMonth || '__all__'}
            onValueChange={(v) => setFilterMonth(v === '__all__' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All months</SelectItem>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{String(y)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
 </div>
 <div className="flex gap-1 p-1 bg-secondary rounded-lg flex-wrap">
 {statuses.map(s => (
 <button
 key={s.value}
 onClick={() => setFilterStatus(s.value)}
 className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
 filterStatus === s.value
 ? 'bg-card text-foreground shadow-sm'
 : 'text-muted-foreground hover:text-foreground dark:hover:text-foreground'
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
 className="flex-1 px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
 />
 </div>

 {isLoading ? (
 <TableSkeleton />
 ) : filtered.length === 0 ? (
 <EmptyState title="No periods found"description="Use Bulk Generate to create periods for all active students." />
 ) : (
 <>
 <DataCardList
 items={filtered}
 getKey={(p) => p.id}
 renderCard={(p) => {
 const balance = p.expectedAmount - p.paidAmount;
 const isOverdue = p.status === PERIOD_STATUS.OVERDUE;
 return {
 title: fullName(p.studentFirstName, p.studentLastName),
 description: `${MONTHS[p.periodMonth - 1]} ${p.periodYear}`,
 badge: <StatusBadge status={p.status} />,
 meta: (
 <>
 <p>Expected: ₱{(p.expectedAmount / 100).toLocaleString('en-PH')}</p>
 <p>Paid: ₱{(p.paidAmount / 100).toLocaleString('en-PH')}</p>
 <p>Due: {new Date(p.dueDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
 </>
 ),
 trailing: balance > 0 ? (
 <span className={isOverdue ? 'text-err' : 'text-warn'}>
 ₱{(balance / 100).toLocaleString('en-PH')}
 </span>
 ) : (
 <span className="text-status-paid-fg">Paid</span>
 ),
 actions: isAdmin && currentUser?.userType === USER_TYPE.SUPERADMIN ? (
 <div className="flex items-center justify-end gap-2">
 <button
 onClick={() => setDeleteTarget(p)}
 aria-label="Delete period"
 className="p-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-err transition-colors"
 >
 <TrashIcon size={18} />
 </button>
 </div>
 ) : undefined,
 };
 }}
 />
 <div className="hidden sm:block rounded-xl border border-border overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-border bg-secondary/40">
 <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Student</th>
 <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Period</th>
 <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Expected</th>
 <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Paid</th>
 <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Balance</th>
 <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
 <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Due</th>
 {isAdmin && <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground"></th>}
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
 {filtered.map(p => {
 const balance = p.expectedAmount - p.paidAmount;
 const isOverdue = p.status === PERIOD_STATUS.OVERDUE;
 return (
 <tr key={p.id}  className="bg-card hover:bg-secondary/40 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">
                  {fullName(p.studentFirstName, p.studentLastName)}
                </td>
 <td className="px-4 py-3 text-muted-foreground">
 {MONTHS[p.periodMonth - 1]} {p.periodYear}
 </td>
 <td className="px-4 py-3 text-right text-foreground">
 ₱{(p.expectedAmount / 100).toLocaleString('en-PH')}
 </td>
 <td className="px-4 py-3 text-right hidden sm:table-cell text-foreground">
 ₱{(p.paidAmount / 100).toLocaleString('en-PH')}
 </td>
 <td className={`px-4 py-3 text-right font-medium hidden sm:table-cell ${balance > 0 ? (isOverdue ? 'text-err' : 'text-warn') : 'text-status-paid-fg'}`}>
 {balance > 0 ? `₱${(balance / 100).toLocaleString('en-PH')}` : '—'}
 </td>
 <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
 <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
 {new Date(p.dueDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
 </td>
 {isAdmin && (
 <td className="px-4 py-3 text-right">
 {currentUser?.userType === USER_TYPE.SUPERADMIN && (
 <button
 onClick={() => setDeleteTarget(p)}
 className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-err transition-colors"
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
 </>
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
