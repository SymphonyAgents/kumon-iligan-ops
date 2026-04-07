'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { usePaymentsQuery, useVerifyPaymentMutation, useFlagPaymentMutation, useRejectPaymentMutation, useDeletePaymentMutation, useRecordPaymentMutation } from '@/hooks/usePaymentsQuery';
import { useStudentsQuery } from '@/hooks/useStudentsQuery';
import { useStudentPeriodsQuery } from '@/hooks/usePaymentPeriodsQuery';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import { PAYMENT_STATUS, PAYMENT_METHOD, USER_TYPE, MONTHS } from '@/lib/constants';
import type { Payment } from '@/lib/types';
import { PlusIcon, CheckIcon, FlagIcon, XIcon, TrashIcon } from '@phosphor-icons/react';

// ---- Record Payment Dialog ----
function RecordPaymentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [studentId, setStudentId] = useState('');
  const [periodId, setPeriodId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const { data: students = [], isLoading: studentsLoading } = useStudentsQuery({ status: 'active' });
  const { data: periods = [], isLoading: periodsLoading } = useStudentPeriodsQuery(studentId);
  const recordMut = useRecordPaymentMutation(() => {
    onClose();
    setStudentId(''); setPeriodId(''); setAmount(''); setMethod(''); setReferenceNumber(''); setNote('');
  });

  const selectedPeriod = periods.find(p => p.id === periodId);
  const unpaidPeriods = periods.filter(p => p.status !== 'paid');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId || !periodId || !amount || !method || !paymentDate) return;
    const student = students.find(s => s.id === studentId);
    recordMut.mutate({
      studentId,
      periodId,
      amount: Math.round(parseFloat(amount) * 100),
      paymentMethod: method,
      referenceNumber: referenceNumber || '',
      receiptImageUrl: '',
      paymentDate,
      note: note || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Student *</label>
            <select
              value={studentId}
              onChange={e => { setStudentId(e.target.value); setPeriodId(''); setAmount(''); }}
              required
              className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">Select student…</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
              ))}
            </select>
          </div>

          {studentId && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Period *</label>
              <select
                value={periodId}
                onChange={e => {
                  setPeriodId(e.target.value);
                  const p = periods.find(x => x.id === e.target.value);
                  if (p) setAmount(((p.expectedAmount - p.paidAmount) / 100).toFixed(2));
                }}
                required
                disabled={periodsLoading}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
              >
                <option value="">Select period…</option>
                {unpaidPeriods.map(p => (
                  <option key={p.id} value={p.id}>
                    {MONTHS[p.periodMonth - 1]} {p.periodYear} — Balance: ₱{((p.expectedAmount - p.paidAmount) / 100).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Amount (₱) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Method *</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">Select method…</option>
              <option value={PAYMENT_METHOD.GCASH}>GCash</option>
              <option value={PAYMENT_METHOD.BANK_TRANSFER}>Bank Transfer</option>
              <option value={PAYMENT_METHOD.CASH}>Cash</option>
              <option value={PAYMENT_METHOD.OTHER}>Other</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Reference No.</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={e => setReferenceNumber(e.target.value)}
              placeholder="GCash / bank reference"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Payment Date *</label>
            <input
              type="date"
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Note</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="Optional note…"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-950 dark:text-zinc-50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={recordMut.isPending}>
              {recordMut.isPending ? 'Recording…' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---- Note Dialog for flag/reject ----
function NoteDialog({ open, title, onConfirm, onClose, loading }: {
  open: boolean; title: string; onConfirm: (note: string) => void; onClose: () => void; loading: boolean;
}) {
  const [note, setNote] = useState('');
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    onConfirm(note.trim());
  }
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setNote(''); onClose(); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Note (required)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              required
              placeholder="Describe the issue…"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-950 dark:text-zinc-50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => { setNote(''); onClose(); }}>Cancel</Button>
            <Button type="submit" variant="danger" disabled={loading || !note.trim()}>
              {loading ? 'Saving…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---- Main Page ----
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  gcash: 'GCash',
  bank_transfer: 'Bank Transfer',
  cash: 'Cash',
  other: 'Other',
};

export default function PaymentsPage() {
  const { data: currentUser } = useCurrentUserQuery();
  const isAdmin = currentUser?.userType === USER_TYPE.ADMIN || currentUser?.userType === USER_TYPE.SUPERADMIN;

  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showRecord, setShowRecord] = useState(false);
  const [flagTarget, setFlagTarget] = useState<Payment | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Payment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);

  const { data: payments = [], isLoading } = usePaymentsQuery(
    statusFilter ? { status: statusFilter } : undefined
  );

  const verifyMut = useVerifyPaymentMutation();
  const flagMut = useFlagPaymentMutation(() => setFlagTarget(null));
  const rejectMut = useRejectPaymentMutation(() => setRejectTarget(null));
  const deleteMut = useDeletePaymentMutation(() => setDeleteTarget(null));

  const filtered = useMemo(() => {
    if (!search.trim()) return payments;
    const q = search.toLowerCase();
    return payments.filter(p =>
      p.number?.toLowerCase().includes(q) ||
      `${p.studentFirstName ?? ''} ${p.studentLastName ?? ''}`.toLowerCase().includes(q) ||
      p.guardianName?.toLowerCase().includes(q) ||
      p.referenceNumber?.toLowerCase().includes(q)
    );
  }, [payments, search]);

  const tabs = [
    { label: 'All', value: '' },
    { label: 'Pending', value: PAYMENT_STATUS.PENDING_REVIEW },
    { label: 'Verified', value: PAYMENT_STATUS.VERIFIED },
    { label: 'Flagged', value: PAYMENT_STATUS.FLAGGED },
    { label: 'Rejected', value: PAYMENT_STATUS.REJECTED },
  ];

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Tuition payment records"
        action={
          <Button onClick={() => setShowRecord(true)}>
            <PlusIcon weight="bold" size={14} />
            Record Payment
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex-wrap">
          {tabs.map(t => (
            <button
              key={t.value}
              onClick={() => setStatusFilter(t.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === t.value
                  ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by student, guardian, reference…"
          className="flex-1 px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No payments found" description="Record the first payment using the button above." />
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">No.</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">Student</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">Method</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">Amount</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden md:table-cell">Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                  {isAdmin && <th className="text-right px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filtered.map(p => (
                  <tr key={p.id} className="bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">{p.number}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">{p.studentFirstName} {p.studentLastName}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">{p.guardianName}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-zinc-600 dark:text-zinc-400">
                      {PAYMENT_METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}
                      {p.referenceNumber && <p className="text-xs text-zinc-400 font-mono">{p.referenceNumber}</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-50">
                      ₱{(p.amount / 100).toLocaleString('en-PH')}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-zinc-500 dark:text-zinc-400">
                      {new Date(p.paymentDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                      {p.note && <p className="text-xs text-zinc-400 mt-0.5 max-w-[140px] truncate">{p.note}</p>}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {p.status === PAYMENT_STATUS.PENDING_REVIEW && (
                            <>
                              <button
                                onClick={() => verifyMut.mutate({ id: p.id })}
                                disabled={verifyMut.isPending}
                                title="Verify"
                                className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                              >
                                <CheckIcon size={14} weight="bold" />
                              </button>
                              <button
                                onClick={() => setFlagTarget(p)}
                                title="Flag"
                                className="p-1.5 rounded-md text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950 transition-colors"
                              >
                                <FlagIcon size={14} weight="bold" />
                              </button>
                              <button
                                onClick={() => setRejectTarget(p)}
                                title="Reject"
                                className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                              >
                                <XIcon size={14} weight="bold" />
                              </button>
                            </>
                          )}
                          {currentUser?.userType === USER_TYPE.SUPERADMIN && (
                            <button
                              onClick={() => setDeleteTarget(p)}
                              title="Delete"
                              className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-red-500 transition-colors"
                            >
                              <TrashIcon size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <RecordPaymentDialog open={showRecord} onClose={() => setShowRecord(false)} />

      <NoteDialog
        open={!!flagTarget}
        title={`Flag Payment ${flagTarget?.number ?? ''}`}
        loading={flagMut.isPending}
        onConfirm={note => flagTarget && flagMut.mutate({ id: flagTarget.id, note })}
        onClose={() => setFlagTarget(null)}
      />
      <NoteDialog
        open={!!rejectTarget}
        title={`Reject Payment ${rejectTarget?.number ?? ''}`}
        loading={rejectMut.isPending}
        onConfirm={note => rejectTarget && rejectMut.mutate({ id: rejectTarget.id, note })}
        onClose={() => setRejectTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Payment"
        description={`Permanently delete ${deleteTarget?.number}? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
