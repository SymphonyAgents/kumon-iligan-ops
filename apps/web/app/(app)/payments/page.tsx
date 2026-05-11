'use client';

import { Suspense, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton, TableSkeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Combobox } from '@/components/ui/combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { PaymentImportDialog } from '@/components/payments/PaymentImportDialog';
import { DataCardList } from '@/components/ui/data-card-list';
import { useUrlParam } from '@/hooks/useUrlParam';
import { toTitleCase, fullName } from '@/utils/text';
import { rowsToCsv, downloadCsv } from '@/utils/csv';
import { UploadSimpleIcon, DownloadSimpleIcon } from '@phosphor-icons/react';
import {
  usePaymentsQuery,
  useVerifyPaymentMutation,
  useFlagPaymentMutation,
  useRejectPaymentMutation,
  useDeletePaymentMutation,
  useRecordPaymentMutation,
} from '@/hooks/usePaymentsQuery';
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

  const { data: students = [], isLoading: studentsLoading } = useStudentsQuery({
    status: 'active',
  });
  const { data: periods = [], isLoading: periodsLoading } = useStudentPeriodsQuery(studentId);
  const recordMut = useRecordPaymentMutation(() => {
    onClose();
    setStudentId('');
    setPeriodId('');
    setAmount('');
    setMethod('');
    setReferenceNumber('');
    setNote('');
  });

  const selectedPeriod = periods.find((p) => p.id === periodId);
  const unpaidPeriods = periods.filter((p) => p.status !== 'paid');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId || !periodId || !amount || !method || !paymentDate) return;
    const student = students.find((s) => s.id === studentId);
    recordMut.mutate({
      studentId,
      periodId,
      amount: parseFloat(amount),
      paymentMethod: method,
      referenceNumber: referenceNumber || '',
      receiptImageUrl: '',
      paymentDate,
      note: note || undefined,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Student *</label>
            <Combobox
              options={students.map((s) => ({
                value: s.id,
                label: fullName(s.firstName, s.lastName),
                description: s.guardianName ? toTitleCase(s.guardianName) : undefined,
                keywords: `${s.firstName} ${s.lastName} ${s.guardianName ?? ''}`,
              }))}
              value={studentId}
              onChange={(v) => {
                setStudentId(v);
                setPeriodId('');
                setAmount('');
              }}
              placeholder={studentsLoading ? 'Loading students…' : 'Select student…'}
              searchPlaceholder="Search by name or guardian"
              emptyMessage="No students match."
            />
          </div>

          {studentId && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">Period *</label>
              <Combobox
                options={unpaidPeriods.map((p) => ({
                  value: p.id,
                  label: `${MONTHS[p.periodMonth - 1]} ${p.periodYear}`,
                  description: `Balance: ₱${(p.expectedAmount - p.paidAmount).toLocaleString('en-PH')}`,
                }))}
                value={periodId}
                onChange={(v) => {
                  setPeriodId(v);
                  const p = periods.find((x) => x.id === v);
                  if (p) setAmount((p.expectedAmount - p.paidAmount).toFixed(2));
                }}
                placeholder={periodsLoading ? 'Loading periods…' : 'Select period…'}
                searchPlaceholder="Search periods"
                emptyMessage="No unpaid periods."
                disabled={periodsLoading}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Amount (₱) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Method *</label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select method…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PAYMENT_METHOD.GCASH}>GCash</SelectItem>
                <SelectItem value={PAYMENT_METHOD.BANK_TRANSFER}>Bank Transfer</SelectItem>
                <SelectItem value={PAYMENT_METHOD.CASH}>Cash</SelectItem>
                <SelectItem value={PAYMENT_METHOD.OTHER}>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Reference No.</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="GCash / bank reference"
              className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Payment Date *</label>
            <DatePicker
              value={paymentDate}
              onChange={setPaymentDate}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Optional note…"
              className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
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
function NoteDialog({
  open,
  title,
  onConfirm,
  onClose,
  loading,
}: {
  open: boolean;
  title: string;
  onConfirm: (note: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [note, setNote] = useState('');
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    onConfirm(note.trim());
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setNote('');
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Note (required)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              required
              placeholder="Describe the issue…"
              className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setNote('');
                onClose();
              }}
            >
              Cancel
            </Button>
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

function PaymentActions({
  payment,
  isAdmin,
  isSuperadmin,
  onVerify,
  onFlag,
  onReject,
  onDelete,
  verifyPending,
}: {
  payment: Payment;
  isAdmin: boolean;
  isSuperadmin: boolean;
  onVerify: (p: Payment) => void;
  onFlag: (p: Payment) => void;
  onReject: (p: Payment) => void;
  onDelete: (p: Payment) => void;
  verifyPending: boolean;
}) {
  if (!isAdmin) return null;
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <div className="flex items-center justify-end gap-2" onClick={stop}>
      {payment.status === PAYMENT_STATUS.PENDING_REVIEW && (
        <>
          <button
            onClick={(e) => {
              stop(e);
              onVerify(payment);
            }}
            disabled={verifyPending}
            title="Verify"
            aria-label="Verify payment"
            className="p-2 rounded-md text-status-paid-fg hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
          >
            <CheckIcon size={18} weight="bold" />
          </button>
          <button
            onClick={(e) => {
              stop(e);
              onFlag(payment);
            }}
            title="Flag"
            aria-label="Flag payment"
            className="p-2 rounded-md text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950 transition-colors"
          >
            <FlagIcon size={18} weight="bold" />
          </button>
          <button
            onClick={(e) => {
              stop(e);
              onReject(payment);
            }}
            title="Reject"
            aria-label="Reject payment"
            className="p-2 rounded-md text-err hover:bg-err-soft dark:hover:bg-red-950 transition-colors"
          >
            <XIcon size={18} weight="bold" />
          </button>
        </>
      )}
      {isSuperadmin && (
        <button
          onClick={(e) => {
            stop(e);
            onDelete(payment);
          }}
          title="Delete"
          aria-label="Delete payment"
          className="p-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-err transition-colors"
        >
          <TrashIcon size={18} />
        </button>
      )}
    </div>
  );
}

function PaymentsContent() {
  const router = useRouter();
  const { data: currentUser } = useCurrentUserQuery();
  const isAdmin =
    currentUser?.userType === USER_TYPE.ADMIN || currentUser?.userType === USER_TYPE.SUPERADMIN;

  const [statusFilter, setStatusFilter] = useUrlParam('status');
  const [search, setSearch] = useUrlParam('q', { history: 'replace' });
  const [showRecord, setShowRecord] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState<Payment | null>(null);
  const [flagTarget, setFlagTarget] = useState<Payment | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Payment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);

  const { data: payments = [], isLoading } = usePaymentsQuery(
    statusFilter ? { status: statusFilter } : undefined,
  );

  const verifyMut = useVerifyPaymentMutation(() => setVerifyTarget(null));
  const flagMut = useFlagPaymentMutation(() => setFlagTarget(null));
  const rejectMut = useRejectPaymentMutation(() => setRejectTarget(null));
  const deleteMut = useDeletePaymentMutation(() => setDeleteTarget(null));

  const filtered = useMemo(() => {
    if (!search.trim()) return payments;
    const q = search.toLowerCase();
    return payments.filter(
      (p) =>
        p.number?.toLowerCase().includes(q) ||
        `${p.studentFirstName ?? ''} ${p.studentLastName ?? ''}`.toLowerCase().includes(q) ||
        p.guardianName?.toLowerCase().includes(q) ||
        p.referenceNumber?.toLowerCase().includes(q),
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
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="secondary"
                aria-label="Export CSV"
                className="px-3 sm:px-[18px]"
                onClick={() => {
                  if (filtered.length === 0) return;
                  const csv = rowsToCsv(
                    filtered.map((p) => ({
                      number: p.number,
                      studentName: fullName(p.studentFirstName, p.studentLastName),
                      guardianName: toTitleCase(p.guardianName ?? ''),
                      amount: p.amount.toFixed(2),
                      expectedAmount: p.expectedAmountSnapshot.toFixed(2),
                      paymentMethod: p.paymentMethod,
                      referenceNumber: p.referenceNumber ?? '',
                      paymentDate: p.paymentDate,
                      status: p.status,
                      recordedAt: p.createdAt,
                    })),
                  );
                  const stamp = new Date().toISOString().split('T')[0];
                  downloadCsv(`kumon-payments-${stamp}.csv`, csv);
                }}
                disabled={filtered.length === 0}
              >
                <DownloadSimpleIcon weight="bold" size={16} />
                <span className="hidden sm:inline">Export CSV</span>
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="secondary"
                aria-label="Import CSV"
                className="px-3 sm:px-[18px]"
                onClick={() => setShowImport(true)}
              >
                <UploadSimpleIcon weight="bold" size={16} />
                <span className="hidden sm:inline">Import CSV</span>
              </Button>
            )}
            {!isAdmin && (
              <Button onClick={() => setShowRecord(true)}>
                <PlusIcon weight="bold" size={16} />
                Record Payment
              </Button>
            )}
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1 p-1 bg-secondary rounded-lg flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setStatusFilter(t.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === t.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground dark:hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student, guardian, reference…"
          className="flex-1 px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Table (sm+) and Mobile Card List (< sm) */}
      {isLoading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No payments found"
          description="Record the first payment using the button above."
        />
      ) : (
        <>
          <DataCardList
            items={filtered}
            getKey={(p) => p.id}
            renderCard={(p) => ({
              onClick: () => router.push(`/payments/${p.id}`),
              title: fullName(p.studentFirstName, p.studentLastName),
              description: toTitleCase(p.guardianName ?? ''),
              badge: <StatusBadge status={p.status} />,
              meta: (
                <>
                  <p className="font-mono">{p.number}</p>
                  <p className="truncate">
                    {PAYMENT_METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}
                    {p.referenceNumber ? ` · ${p.referenceNumber}` : ''}
                  </p>
                  <p>
                    {new Date(p.paymentDate).toLocaleDateString('en-PH', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </>
              ),
              trailing: `₱${p.amount.toLocaleString('en-PH')}`,
              note: p.note ?? undefined,
              actions:
                isAdmin &&
                (p.status === PAYMENT_STATUS.PENDING_REVIEW ||
                  currentUser?.userType === USER_TYPE.SUPERADMIN) ? (
                  <PaymentActions
                    payment={p}
                    isAdmin={isAdmin}
                    isSuperadmin={currentUser?.userType === USER_TYPE.SUPERADMIN}
                    onVerify={setVerifyTarget}
                    onFlag={setFlagTarget}
                    onReject={setRejectTarget}
                    onDelete={setDeleteTarget}
                    verifyPending={verifyMut.isPending}
                  />
                ) : undefined,
            })}
          />

          {/* Table (sm and up) */}
          <div className="hidden sm:block rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                      No.
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                      Student
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">
                      Method
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                      Amount
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">
                      Date
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                      Status
                    </th>
                    {isAdmin && (
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/payments/${p.id}`)}
                      className="bg-card hover:bg-secondary/40 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {p.number}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">
                          {fullName(p.studentFirstName, p.studentLastName)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {toTitleCase(p.guardianName ?? '')}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-foreground">
                        {PAYMENT_METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}
                        {p.referenceNumber && (
                          <p className="text-xs text-muted-foreground font-mono">
                            {p.referenceNumber}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        ₱{p.amount.toLocaleString('en-PH')}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        {new Date(p.paymentDate).toLocaleDateString('en-PH', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                        {p.note && (
                          <p className="text-xs text-muted-foreground mt-0.5 max-w-[140px] truncate">
                            {p.note}
                          </p>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <PaymentActions
                            payment={p}
                            isAdmin={isAdmin}
                            isSuperadmin={currentUser?.userType === USER_TYPE.SUPERADMIN}
                            onVerify={setVerifyTarget}
                            onFlag={setFlagTarget}
                            onReject={setRejectTarget}
                            onDelete={setDeleteTarget}
                            verifyPending={verifyMut.isPending}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <RecordPaymentDialog open={showRecord} onClose={() => setShowRecord(false)} />
      <PaymentImportDialog open={showImport} onClose={() => setShowImport(false)} />

      <ConfirmDialog
        open={!!verifyTarget}
        title="Verify Payment"
        description={`Mark ${verifyTarget?.number} as verified? This adds ₱${(verifyTarget?.amount ?? 0).toLocaleString('en-PH')} to the period total.`}
        confirmLabel="Verify"
        onConfirm={() => verifyTarget && verifyMut.mutate({ id: verifyTarget.id })}
        onCancel={() => setVerifyTarget(null)}
        loading={verifyMut.isPending}
      />
      <NoteDialog
        open={!!flagTarget}
        title={`Flag Payment ${flagTarget?.number ?? ''}`}
        loading={flagMut.isPending}
        onConfirm={(note) => flagTarget && flagMut.mutate({ id: flagTarget.id, note })}
        onClose={() => setFlagTarget(null)}
      />
      <NoteDialog
        open={!!rejectTarget}
        title={`Reject Payment ${rejectTarget?.number ?? ''}`}
        loading={rejectMut.isPending}
        onConfirm={(note) => rejectTarget && rejectMut.mutate({ id: rejectTarget.id, note })}
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

export default function PaymentsPage() {
  return (
    <Suspense>
      <PaymentsContent />
    </Suspense>
  );
}
