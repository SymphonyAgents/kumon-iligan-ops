'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStudentQuery } from '@/hooks/useStudentsQuery';
import { useFamilyMembersQuery } from '@/hooks/useFamilyMembersQuery';
import { FamilyMembersDialog } from '@/components/families/family-members-dialog';
import { useStudentPeriodsQuery } from '@/hooks/usePaymentPeriodsQuery';
import { usePaymentsQuery, useRecordPaymentMutation } from '@/hooks/usePaymentsQuery';
import { PAYMENT_METHOD, PAYMENT_STATUS, MONTHS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { fullName, toTitleCase } from '@/utils/text';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  WarningIcon,
  UsersThreeIcon,
  CameraIcon,
  ReceiptIcon,
  UploadSimpleIcon,
} from '@phosphor-icons/react';

const METHOD_OPTIONS: Array<[string, string]> = [
  [PAYMENT_METHOD.GCASH, 'GCash'],
  [PAYMENT_METHOD.BANK_TRANSFER, 'Bank Transfer'],
  [PAYMENT_METHOD.CASH, 'Cash'],
  [PAYMENT_METHOD.OTHER, 'Other'],
];

function fmtPeso(value: number) {
  return `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;
}

function BackLink({ href, label }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      aria-label={label ?? 'Go back'}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
    >
      <ArrowLeftIcon size={16} />
    </Link>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
      {children}
    </p>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
      {children}
      {required && <span className="text-err ml-0.5">*</span>}
    </span>
  );
}

function Fact({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
        {label}
      </p>
      <p
        className={cn(
          'text-[18px] font-semibold tracking-[-0.2px] mt-1',
          accent ? 'text-status-unpaid-fg' : 'text-foreground',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ReceiptSlot({
  file,
  preview,
  onFile,
  error,
}: {
  file: File | null;
  preview: string | null;
  onFile: (f: File) => void;
  error?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel required>Receipt screenshot</FieldLabel>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) onFile(e.target.files[0]);
        }}
      />
      {preview ? (
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl border border-border bg-sunken">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Receipt"
            className="w-14 h-14 rounded-lg object-cover border border-border bg-card"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file?.name ?? 'receipt'}</p>
            <p className="text-xs text-muted-foreground">
              {file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB · ` : ''}drag a new file or tap
              to replace
            </p>
          </div>
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            Replace
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className={cn(
            'w-full border border-dashed rounded-xl py-7 px-4 flex flex-col items-center gap-2 transition-colors',
            error
              ? 'border-err/50 bg-err-soft'
              : 'border-border-strong/40 hover:border-accent hover:bg-accent-soft/40',
          )}
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <CameraIcon size={20} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Take photo or upload</p>
          <p className="text-xs text-muted-foreground">GCash / bank receipt · max 5MB</p>
        </button>
      )}
      {error && <p className="text-xs text-err">{error}</p>}
    </div>
  );
}

function SuccessScreen({ paymentNumber, onDone }: { paymentNumber: string; onDone: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
      <div className="w-20 h-20 rounded-full bg-status-paid-bg flex items-center justify-center">
        <CheckCircleIcon size={40} weight="fill" className="text-status-paid-dot" />
      </div>
      <div>
        <p className="text-[24px] font-semibold tracking-[-0.4px]">Payment recorded</p>
        <p className="text-sm text-muted-foreground mt-1.5">
          Reference:{' '}
          <span className="font-mono font-semibold text-foreground">{paymentNumber}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">Pending admin review</p>
      </div>
      <Button variant="secondary" onClick={onDone}>
        <ArrowLeftIcon size={14} /> Back to students
      </Button>
    </div>
  );
}

export default function SDCFormPage() {
  const params = useParams<{ studentId: string }>();
  const router = useRouter();

  const { data: student, isLoading: studentLoading } = useStudentQuery(params.studentId);
  const { data: periods = [], isLoading: periodsLoading } = useStudentPeriodsQuery(
    params.studentId,
  );
  const { data: studentPayments = [] } = usePaymentsQuery({ studentId: params.studentId });
  const familyId = student?.familyId;
  const { data: familyMembersList = [] } = useFamilyMembersQuery(familyId);

  const currentPeriod =
    student?.currentPeriod ?? periods.find((p) => p.status !== 'paid') ?? periods[0];

  const [referenceNumber, setRef] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [paymentDate, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [includeSibling, setIncludeSibling] = useState(false);
  const [paidByMemberId, setPaidByMemberId] = useState<string>('');
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);

  // Default the "paid by" selector to the family's primary member once members load.
  useEffect(() => {
    if (paidByMemberId) return;
    const primary = familyMembersList.find((m) => m.isPrimary);
    if (primary) setPaidByMemberId(primary.id);
  }, [familyMembersList, paidByMemberId]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successPayNum, setSuccess] = useState<string | null>(null);

  const recordMut = useRecordPaymentMutation(() => {});

  useEffect(() => {
    if (!receiptFile) return;
    const url = URL.createObjectURL(receiptFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [receiptFile]);

  useEffect(() => {
    if (currentPeriod && !amount) {
      const remaining = currentPeriod.expectedAmount - currentPeriod.paidAmount;
      if (remaining > 0) setAmount(String(remaining));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPeriod?.id]);

  const expectedAmount = currentPeriod?.expectedAmount ?? 0;
  const enteredAmount = parseFloat(amount);
  const amountDiff =
    expectedAmount > 0 ? Math.abs(enteredAmount - expectedAmount) / expectedAmount : 0;
  const amountWarn = amount && !isNaN(enteredAmount) && amountDiff > 0.1;

  const siblings = useMemo(
    () =>
      (student?.family?.students ?? []).filter(
        (s) => s.id !== params.studentId && s.status === 'active',
      ),
    [student?.family?.students, params.studentId],
  );

  const recentPayments = useMemo(
    () =>
      [...studentPayments]
        .filter((p) => p.status === PAYMENT_STATUS.VERIFIED)
        .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
        .slice(0, 3),
    [studentPayments],
  );

  // If the teacher has already submitted a payment for this period that's still
  // pending review or flagged, pre-fill the form with its values (read-only) and
  // surface a banner pointing to the existing record.
  const existingPending = useMemo(() => {
    if (!currentPeriod) return null;
    return (
      studentPayments.find(
        (p) =>
          p.periodId === currentPeriod.id &&
          (p.status === PAYMENT_STATUS.PENDING_REVIEW || p.status === PAYMENT_STATUS.FLAGGED),
      ) ?? null
    );
  }, [studentPayments, currentPeriod]);

  // Pre-fill once when an existing pending payment is found.
  useEffect(() => {
    if (!existingPending) return;
    setRef(existingPending.referenceNumber ?? '');
    setAmount(String(existingPending.amount));
    setMethod(existingPending.paymentMethod);
    setDate(existingPending.paymentDate);
    setNote(existingPending.note ?? '');
    if (existingPending.paidByMemberId) setPaidByMemberId(existingPending.paidByMemberId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingPending?.id]);

  const isLocked = !!existingPending;

  function validate() {
    const e: Record<string, string> = {};
    if (!referenceNumber.trim()) e.ref = 'Reference number is required';
    if (!amount || parseFloat(amount) <= 0) e.amount = 'Amount must be greater than zero';
    if (!method) e.method = 'Please select a payment method';
    if (!paymentDate) e.date = 'Payment date is required';
    if (new Date(paymentDate) > new Date()) e.date = 'Payment date cannot be in the future';
    if (!receiptFile) e.receipt = 'Receipt screenshot is required';
    if (receiptFile && receiptFile.size > 5 * 1024 * 1024) e.receipt = 'File exceeds 5MB limit';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    if (!currentPeriod || !receiptFile) return;

    try {
      setUploading(true);
      const { uploadUrl, fileUrl } = await api.payments.getUploadUrl({
        fileName: receiptFile.name,
        fileType: receiptFile.type,
      });
      await fetch(uploadUrl, {
        method: 'PUT',
        body: receiptFile,
        headers: { 'Content-Type': receiptFile.type },
      });
      const payment = await api.payments.record({
        studentId: params.studentId,
        periodId: currentPeriod.id,
        amount: parseFloat(amount),
        paymentMethod: method,
        referenceNumber: referenceNumber.trim(),
        receiptImageUrl: fileUrl,
        paymentDate,
        note: note.trim() || undefined,
        paidByMemberId: paidByMemberId || undefined,
      });
      setSuccess(payment.number);
    } catch (err) {
      setErrors({ submit: (err as Error).message ?? 'Something went wrong' });
    } finally {
      setUploading(false);
    }
  }

  const isLoading = studentLoading || periodsLoading;
  const studentName = student ? fullName(student.firstName, student.lastName) : '';

  if (successPayNum) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <BackLink href="/sdc" />
          <Kicker>Payment recorded</Kicker>
        </div>
        <SuccessScreen paymentNumber={successPayNum} onDone={() => router.push('/sdc')} />
      </div>
    );
  }

  // ── LOADING ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <BackLink href="/sdc" />
          <Kicker>Auto-filled from records</Kicker>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
          <Skeleton className="h-[480px] rounded-2xl" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-[160px] rounded-2xl" />
            <Skeleton className="h-[200px] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const initials = student
    ? `${student.firstName?.[0] ?? ''}${student.lastName?.[0] ?? ''}`.toUpperCase()
    : '';
  const guardian = student?.family?.guardianName ?? student?.guardianName ?? null;
  const guardianPhone = student?.family?.guardianPhone ?? null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <BackLink href="/sdc" />
        <div className="min-w-0 flex-1">
          <Kicker>Auto-filled from records</Kicker>
          <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-[-0.5px] mt-1">
            Record payment
          </h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-start"
      >
        {/* ── LEFT — form card ─────────────────────────────────────── */}
        <fieldset
          disabled={isLocked}
          className="rounded-2xl border border-border bg-card p-5 sm:p-7 flex flex-col gap-5 disabled:opacity-90"
        >
          {/* Student header */}
          <div className="flex items-center gap-3 sm:gap-4 pb-4 border-b border-border">
            <div className="w-12 h-12 rounded-xl bg-accent-soft text-accent-ink flex items-center justify-center text-base font-semibold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base sm:text-[18px] font-semibold tracking-[-0.2px] truncate">
                {studentName}
              </p>
              <p className="text-xs sm:text-[13px] text-muted-foreground truncate">
                {[
                  student?.level && `Level ${student.level}`,
                  guardian && toTitleCase(guardian),
                  guardianPhone,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            {currentPeriod && <StatusBadge status={currentPeriod.status} />}
          </div>

          {/* Pending-submission banner — already submitted for this period */}
          {existingPending && (
            <div className="flex flex-col gap-2.5 rounded-xl bg-warn-soft border border-warn/40 px-3.5 py-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-card flex items-center justify-center shrink-0">
                  <ReceiptIcon size={15} className="text-warn" weight="fill" />
                </div>
                <div className="flex-1 min-w-0 text-[13.5px]">
                  <p className="font-semibold text-foreground">
                    {existingPending.status === PAYMENT_STATUS.FLAGGED
                      ? 'Admin flagged this submission'
                      : "You've already submitted this payment"}
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    Reference{' '}
                    <span className="font-mono text-foreground">{existingPending.number}</span> ·
                    submitted {new Date(existingPending.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} ·{' '}
                    {existingPending.status === PAYMENT_STATUS.FLAGGED ? 'awaiting your reply' : 'pending admin review'}
                  </p>
                </div>
                <Link
                  href={`/recordings?selected=${existingPending.id}`}
                  className="text-[12.5px] font-medium text-primary hover:text-accent-ink whitespace-nowrap"
                >
                  View →
                </Link>
              </div>
            </div>
          )}

          {/* Sibling banner */}
          {siblings.length > 0 && (
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-accent-soft border border-accent/25">
              <div className="w-7 h-7 rounded-lg bg-card flex items-center justify-center shrink-0">
                <UsersThreeIcon size={15} className="text-accent" weight="bold" />
              </div>
              <div className="flex-1 min-w-0 text-[13.5px] text-accent-ink">
                <span className="font-semibold">
                  {siblings.length} sibling{siblings.length === 1 ? '' : 's'} enrolled
                </span>
                <span className="text-foreground/80">
                  {' '}
                  — {siblings.map((s) => s.firstName).join(', ')}. Same guardian, same receipt?
                </span>
              </div>
              <label className="flex items-center gap-2 text-[13px] font-medium text-accent-ink cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={includeSibling}
                  onChange={(e) => setIncludeSibling(e.target.checked)}
                  className="accent-accent"
                />
                Include
              </label>
            </div>
          )}

          {/* Paid by — which family member sent the receipt */}
          {familyMembersList.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <FieldLabel>Paid by</FieldLabel>
                {familyId && (
                  <button
                    type="button"
                    onClick={() => setMembersDialogOpen(true)}
                    className="text-[11.5px] font-medium text-primary hover:text-accent-ink transition-colors"
                  >
                    + Add member
                  </button>
                )}
              </div>
              <Select value={paidByMemberId} onValueChange={setPaidByMemberId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select who paid…" />
                </SelectTrigger>
                <SelectContent>
                  {familyMembersList.map((m) => {
                    const label = toTitleCase(m.fullName);
                    const relation =
                      m.relation === 'guardian'
                        ? 'Guardian'
                        : m.relation === 'mother'
                          ? 'Mother'
                          : m.relation === 'father'
                            ? 'Father'
                            : m.relation === 'grandmother'
                              ? 'Grandmother'
                              : m.relation === 'grandfather'
                                ? 'Grandfather'
                                : m.relation === 'aunt'
                                  ? 'Aunt'
                                  : m.relation === 'uncle'
                                    ? 'Uncle'
                                    : 'Other';
                    return (
                      <SelectItem key={m.id} value={m.id}>
                        {label}{' '}
                        <span className="text-muted-foreground">
                          · {relation}
                          {m.isPrimary ? ' (primary)' : ''}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Form grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <FieldLabel required>Reference number</FieldLabel>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => {
                  setRef(e.target.value);
                  if (errors.ref) setErrors((p) => ({ ...p, ref: '' }));
                }}
                placeholder="GCash or bank transaction reference"
                className={cn(
                  'w-full px-3.5 py-2.5 text-[14px] bg-card border rounded-xl text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20',
                  errors.ref ? 'border-err' : 'border-border focus:border-primary',
                )}
              />
              {errors.ref && <p className="text-xs text-err">{errors.ref}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <FieldLabel required>Amount paid</FieldLabel>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                  ₱
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) setErrors((p) => ({ ...p, amount: '' }));
                  }}
                  placeholder={currentPeriod ? String(currentPeriod.expectedAmount) : '0.00'}
                  className={cn(
                    'w-full pl-7 pr-3.5 py-2.5 text-[14px] bg-card border rounded-xl text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20',
                    errors.amount
                      ? 'border-err'
                      : amountWarn
                        ? 'border-warn'
                        : 'border-border focus:border-primary',
                  )}
                />
              </div>
              {errors.amount && <p className="text-xs text-err">{errors.amount}</p>}
              {amountWarn && !errors.amount && (
                <div className="flex items-center gap-1.5 text-warn">
                  <WarningIcon size={13} weight="fill" />
                  <p className="text-xs">
                    Differs from expected ({fmtPeso(expectedAmount)}) by &gt;10%.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:col-span-1">
              <FieldLabel required>Payment method</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {METHOD_OPTIONS.map(([id, label]) => {
                  const active = method === id;
                  return (
                    <button
                      type="button"
                      key={id}
                      onClick={() => {
                        setMethod(id);
                        if (errors.method) setErrors((p) => ({ ...p, method: '' }));
                      }}
                      className={cn(
                        'px-3 py-2.5 rounded-xl text-[13.5px] text-left border transition-colors',
                        active
                          ? 'bg-accent-soft border-accent text-accent-ink font-medium'
                          : 'bg-card border-border text-foreground hover:bg-secondary/40',
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {errors.method && <p className="text-xs text-err">{errors.method}</p>}
            </div>

            <div className="flex flex-col gap-2 sm:col-span-1">
              <FieldLabel required>Payment date</FieldLabel>
              <input
                type="date"
                value={paymentDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((p) => ({ ...p, date: '' }));
                }}
                className={cn(
                  'w-full px-3.5 py-2.5 text-[14px] bg-card border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20',
                  errors.date ? 'border-err' : 'border-border focus:border-primary',
                )}
              />
              {errors.date && <p className="text-xs text-err">{errors.date}</p>}
            </div>
          </div>

          <ReceiptSlot
            file={receiptFile}
            preview={receiptPreview}
            onFile={(f) => {
              setReceiptFile(f);
              if (errors.receipt) setErrors((p) => ({ ...p, receipt: '' }));
            }}
            error={errors.receipt}
          />

          <div className="flex flex-col gap-2">
            <FieldLabel>Notes (optional)</FieldLabel>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="e.g. Parent says will pay remaining next week"
              className="w-full px-3.5 py-2.5 text-[14px] bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground/70 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {errors.submit && (
            <div className="px-4 py-3 rounded-xl bg-err-soft border border-err/40 text-sm text-err">
              {errors.submit}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            {isLocked && (
              <p className="text-[12.5px] text-muted-foreground">
                Locked — already submitted for this period.
              </p>
            )}
            <Button
              type="submit"
              disabled={uploading || recordMut.isPending || !currentPeriod || isLocked}
            >
              {uploading ? (
                <>
                  <UploadSimpleIcon size={16} className="animate-bounce" />
                  Uploading…
                </>
              ) : recordMut.isPending ? (
                'Recording…'
              ) : (
                <>
                  <ReceiptIcon size={16} weight="fill" />
                  Review &amp; submit
                </>
              )}
            </Button>
          </div>
          {!currentPeriod && (
            <p className="text-xs text-muted-foreground text-right">
              No active period for this student. Ask an admin to create one.
            </p>
          )}
        </fieldset>

        {/* ── RIGHT — context rail ─────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Period at a glance */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <Kicker>Period at a glance</Kicker>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 mt-4">
              <Fact
                label="Period"
                value={
                  currentPeriod
                    ? `${MONTHS[currentPeriod.periodMonth - 1]} ${currentPeriod.periodYear}`
                    : '—'
                }
              />
              <Fact
                label="Expected"
                value={currentPeriod ? fmtPeso(currentPeriod.expectedAmount) : '—'}
              />
              <Fact
                label="Paid so far"
                value={currentPeriod ? fmtPeso(currentPeriod.paidAmount) : '—'}
              />
              <Fact
                label="Outstanding"
                value={
                  currentPeriod
                    ? fmtPeso(Math.max(0, currentPeriod.expectedAmount - currentPeriod.paidAmount))
                    : '—'
                }
                accent={
                  !!currentPeriod && currentPeriod.expectedAmount - currentPeriod.paidAmount > 0
                }
              />
            </div>
          </div>

          {/* Recent payments */}
          {recentPayments.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <Kicker>Recent payments · {student?.firstName}</Kicker>
              <div className="flex flex-col mt-3">
                {recentPayments.map((r, i) => {
                  const periodLabel = r.paymentDate
                    ? new Date(r.paymentDate).toLocaleDateString('en-PH', {
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—';
                  return (
                    <div
                      key={r.id}
                      className={cn(
                        'flex items-center justify-between gap-3 py-2.5',
                        i > 0 && 'border-t border-border',
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{periodLabel}</p>
                        <p className="text-[11.5px] text-muted-foreground font-mono mt-0.5 truncate">
                          {r.referenceNumber ?? '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[14px] font-semibold tracking-[-0.2px]">
                          {fmtPeso(r.amount)}
                        </span>
                        <span className="w-2 h-2 rounded-full bg-status-paid-dot" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tip */}
          <div className="rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-[13px] leading-relaxed text-foreground">
            <span className="font-semibold">Tip</span> — submitting marks this as{' '}
            <em>pending review</em>. Nina will verify against the receipt before it lands on the
            period.
          </div>
        </div>
      </form>

      <FamilyMembersDialog
        open={membersDialogOpen}
        familyId={familyId ?? null}
        onClose={() => setMembersDialogOpen(false)}
        openAddOnMount
        title={`Members — ${student?.family?.guardianName ? toTitleCase(student.family.guardianName) : 'Family'}`}
      />
    </div>
  );
}
