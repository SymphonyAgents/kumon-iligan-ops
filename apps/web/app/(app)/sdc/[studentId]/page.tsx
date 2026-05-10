'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { useStudentQuery } from '@/hooks/useStudentsQuery';
import { useStudentPeriodsQuery } from '@/hooks/usePaymentPeriodsQuery';
import { useRecordPaymentMutation } from '@/hooks/usePaymentsQuery';
import { PAYMENT_METHOD, MONTHS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import {
 ArrowLeftIcon,
 UploadSimpleIcon,
 CheckCircleIcon,
 WarningIcon,
 UsersThreeIcon,
 XIcon,
 CameraIcon,
 ReceiptIcon,
} from '@phosphor-icons/react';

// ── Money helpers ──────────────────────────────────────────────────────────
function fmt(amount: number) {
 return `₱${(amount / 100).toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;
}
function toScaled(v: string) { return Math.round(parseFloat(v) * 100); }

const METHOD_LABELS: Record<string, string> = {
 [PAYMENT_METHOD.GCASH]: 'GCash',
 [PAYMENT_METHOD.BANK_TRANSFER]: 'Bank Transfer',
 [PAYMENT_METHOD.CASH]: 'Cash',
 [PAYMENT_METHOD.OTHER]: 'Other',
};

// ── Field wrapper (label + required marker only, no error, that goes in Input) ──
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
 return (
 <div className="flex flex-col gap-1.5">
 <span className="text-xs font-medium text-muted-foreground">
 {label}{required && <span className="text-destructive ml-0.5">*</span>}
 </span>
 {children}
 </div>
 );
}

// ── Receipt uploader ───────────────────────────────────────────────────────
function ReceiptUpload({
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
 <div>
 <input
 ref={ref}
 type="file"
 accept="image/*"
 capture="environment"
 className="hidden"
 onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]); }}
 />
 {preview ? (
 <div className="relative rounded-xl overflow-hidden border border-border bg-secondary/40">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img src={preview} alt="Receipt" className="w-full max-h-48 object-contain" />
 <button
 type="button"
 onClick={() => ref.current?.click()}
 className="absolute bottom-2 right-2 px-3 py-1.5 text-xs font-medium bg-white dark:bg-secondary border border-border rounded-lg shadow-sm hover:bg-secondary/40 dark:hover:bg-secondary transition-colors"
 >
 Replace
 </button>
 </div>
 ) : (
 <button
 type="button"
 onClick={() => ref.current?.click()}
 className={cn(
 'w-full border-2 border-dashed rounded-xl py-8 flex flex-col items-center gap-2 transition-colors',
 error
 ? 'border-red-300 dark:border-red-800 bg-err-soft dark:bg-red-950/20'
 : 'border-border hover:border-border dark:hover:border-border hover:bg-secondary/40',
 )}
 >
 <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
 <CameraIcon size={20} className="text-muted-foreground" />
 </div>
 <div className="text-center">
 <p className="text-sm font-medium text-foreground">Tap to take photo or upload</p>
 <p className="text-xs text-muted-foreground mt-0.5">GCash / bank receipt screenshot · max 5MB</p>
 </div>
 </button>
 )}
 {error && <p className="text-xs text-err mt-1">{error}</p>}
 </div>
 );
}

// ── Success screen ─────────────────────────────────────────────────────────
function SuccessScreen({ paymentNumber, onDone }: { paymentNumber: string; onDone: () => void }) {
 return (
 <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
 <div className="w-20 h-20 rounded-full bg-status-paid-bg flex items-center justify-center">
 <CheckCircleIcon size={40} weight="fill" className="text-status-paid-dot" />
 </div>
 <div>
 <p className="text-xl font-semibold text-foreground">Payment recorded!</p>
 <p className="text-sm text-muted-foreground mt-1">
 Reference: <span className="font-mono font-semibold text-foreground">{paymentNumber}</span>
 </p>
 <p className="text-xs text-muted-foreground mt-1">Pending admin review</p>
 </div>
 <div className="flex gap-3">
 <Button variant="secondary" onClick={onDone}>
 <ArrowLeftIcon size={14} />
 Back to students
 </Button>
 </div>
 </div>
 );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function SDCFormPage() {
 const params = useParams<{ studentId: string }>();
 const router = useRouter();

 const { data: student, isLoading: studentLoading } = useStudentQuery(params.studentId);
 const { data: periods = [], isLoading: periodsLoading } = useStudentPeriodsQuery(params.studentId);

 // Current period = most recent non-paid or first available
 const currentPeriod = student?.currentPeriod
 ?? periods.find(p => p.status !== 'paid')
 ?? periods[0];

 // Form state
 const [referenceNumber, setRef] = useState('');
 const [amount, setAmount] = useState('');
 const [method, setMethod] = useState('');
 const [paymentDate, setDate] = useState(new Date().toISOString().split('T')[0]);
 const [note, setNote] = useState('');
 const [receiptFile, setReceiptFile] = useState<File | null>(null);
 const [receiptPreview, setPreview] = useState<string | null>(null);
 const [uploading, setUploading] = useState(false);
 const [errors, setErrors] = useState<Record<string, string>>({});
 const [successPayNum, setSuccess] = useState<string | null>(null);

 const recordMut = useRecordPaymentMutation((/* data */) => {});

 // Set preview when file changes
 useEffect(() => {
 if (!receiptFile) return;
 const url = URL.createObjectURL(receiptFile);
 setPreview(url);
 return () => URL.revokeObjectURL(url);
 }, [receiptFile]);

 // Auto-fill amount with expected
 useEffect(() => {
 if (currentPeriod && !amount) {
 const remaining = currentPeriod.expectedAmount - currentPeriod.paidAmount;
 if (remaining > 0) setAmount(String(remaining / 100));
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [currentPeriod?.id]);

 const expectedAmount = currentPeriod?.expectedAmount ?? 0;
 const enteredAmount = parseFloat(amount) * 100;
 const amountDiff = expectedAmount > 0 ? Math.abs(enteredAmount - expectedAmount) / expectedAmount : 0;
 const amountWarn = amount && !isNaN(enteredAmount) && amountDiff > 0.1;

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
 if (Object.keys(errs).length > 0) { setErrors(errs); return; }
 setErrors({});

 if (!currentPeriod || !receiptFile) return;

 try {
 setUploading(true);

 // 1. Get presigned upload URL
 const { uploadUrl, fileUrl } = await api.payments.getUploadUrl({
 fileName: receiptFile.name, fileType: receiptFile.type, });

 // 2. Upload the file
 await fetch(uploadUrl, {
 method: 'PUT',
 body: receiptFile, headers: { 'Content-Type': receiptFile.type },
 });

 // 3. Record the payment
 const payment = await api.payments.record({
 studentId: params.studentId, periodId: currentPeriod.id, amount: toScaled(amount), paymentMethod: method, referenceNumber: referenceNumber.trim(), receiptImageUrl: fileUrl, paymentDate,
 note: note.trim() || undefined,
 });

 setSuccess(payment.number);
 } catch (err) {
 setErrors({ submit: (err as Error).message ?? 'Something went wrong' });
 } finally {
 setUploading(false);
 }
 }

 const isLoading = studentLoading || periodsLoading;

 if (successPayNum) {
 return (
 <div>
 <PageHeader
 title="Payment Recorded"
 backButton={
 <Link href="/sdc" className="p-2 rounded-lg hover:bg-secondary transition-colors">
 <ArrowLeftIcon size={18} className="text-muted-foreground" />
 </Link>
 }
 />
 <SuccessScreen paymentNumber={successPayNum} onDone={() => router.push('/sdc')} />
 </div>
 );
 }

 return (
 <div>
 <PageHeader
 title={isLoading ? 'Loading…' : `${student?.firstName} ${student?.lastName}`}
 subtitle={student?.level ?? undefined}
 backButton={
 <Link href="/sdc" className="p-2 rounded-lg hover:bg-secondary transition-colors">
 <ArrowLeftIcon size={18} className="text-muted-foreground" />
 </Link>
 }
 />

 {isLoading ? (
 <div className="flex flex-col gap-4">
 <Skeleton className="h-24 rounded-xl" />
 <Skeleton className="h-64 rounded-xl" />
 </div>
 ) : (
 <form onSubmit={handleSubmit} className="flex flex-col gap-6" >

 {/* ── Student info panel ─────────────────────────────────────── */}
 <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3.5 flex flex-col gap-2.5">
 <div className="flex items-start justify-between gap-3">
 <div>
 <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Guardian</p>
 <p className="text-sm font-semibold text-foreground mt-0.5">
 {student?.family?.guardianName ?? student?.guardianName ?? '—'}
 </p>
 {student?.family?.guardianPhone && (
 <p className="text-xs text-muted-foreground">{student.family.guardianPhone}</p>
 )}
 </div>
 <div className="text-right shrink-0">
 <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Period</p>
 <p className="text-sm font-semibold text-foreground mt-0.5">
 {currentPeriod ? `${MONTHS[(currentPeriod.periodMonth ?? 1) - 1]} ${currentPeriod.periodYear}` : '—'}
 </p>
 {currentPeriod && <StatusBadge status={currentPeriod.status} />}
 </div>
 </div>

 {currentPeriod && (
 <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/50">
 {[
 { label: 'Expected', value: fmt(currentPeriod.expectedAmount) },
 { label: 'Paid', value: fmt(currentPeriod.paidAmount) },
 { label: 'Remaining', value: fmt(Math.max(0, currentPeriod.expectedAmount - currentPeriod.paidAmount)), bold: true },
 ].map(({ label, value, bold }) => (
 <div key={label} className="text-center">
 <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
 <p className={cn('text-sm mt-0.5', bold ? 'font-bold text-foreground' : 'font-medium text-foreground ')}>
 {value}
 </p>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* ── Sibling banner ─────────────────────────────────────────── */}
 {(student?.family?.students?.length ?? 0) > 1 && (
 <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-accent-soft/40 border border-primary/20" >
 <UsersThreeIcon size={18} weight="fill" className="text-primary shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-semibold text-primary" >
 {(student!.family!.students!.length - 1)} sibling{(student!.family!.students!.length - 1) > 1 ? 's' : ''} also enrolled
 </p>
 <p className="text-xs text-primary mt-0.5">
 If the parent paid for multiple children, record each one separately after this.
 </p>
 </div>
 </div>
 )}

 {/* ── Payment form fields ────────────────────────────────────── */}
 <div className="flex flex-col gap-4">

 <Input
 label="Reference number"
 required
 type="text"
 value={referenceNumber}
 onChange={e => { setRef(e.target.value); if (errors.ref) setErrors(p => ({ ...p, ref: '' })); }}
 placeholder="GCash or bank transaction reference"
 error={errors.ref}
 />

 <div className="flex flex-col gap-1.5">
 <span className="text-xs font-medium text-muted-foreground">
 Amount paid<span className="text-destructive ml-0.5">*</span>
 </span>
 <div className="relative">
 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none">₱</span>
 <Input
 type="number"
 step="0.01"
 min="0"
 value={amount}
 onChange={e => { setAmount(e.target.value); if (errors.amount) setErrors(p => ({ ...p, amount: '' })); }}
 placeholder={currentPeriod ? String(currentPeriod.expectedAmount / 100) : '0.00'}
 error={errors.amount}
 className="pl-8"
 />
 </div>
 {amountWarn && (
 <div className="flex items-center gap-1.5 text-[var(--color-warn)]">
 <WarningIcon size={14} weight="fill" />
 <p className="text-xs">
 Amount differs from expected ({fmt(expectedAmount)}) by more than 10%. Please verify.
 </p>
 </div>
 )}
 </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-medium text-muted-foreground tracking-[0.01em]">
              Payment method <span className="text-err">*</span>
            </label>
            <Select
              value={method}
              onValueChange={(v) => {
                setMethod(v);
                if (errors.method) setErrors((p) => ({ ...p, method: '' }));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select method…" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(METHOD_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.method && <p className="text-[12.5px] text-err">{errors.method}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-medium text-muted-foreground tracking-[0.01em]">
              Payment date <span className="text-err">*</span>
            </label>
            <DatePicker
              value={paymentDate}
              onChange={(v) => { setDate(v); if (errors.date) setErrors((p) => ({ ...p, date: '' })); }}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.date && <p className="text-[12.5px] text-err">{errors.date}</p>}
          </div>

          <Field label="Receipt screenshot" required>
 <ReceiptUpload
 file={receiptFile}
 preview={receiptPreview}
 onFile={f => { setReceiptFile(f); if (errors.receipt) setErrors(p => ({ ...p, receipt: '' })); }}
 error={errors.receipt}
 />
 </Field>

 <Textarea
 label="Notes"
 value={note}
 onChange={e => setNote(e.target.value)}
 placeholder="Optional, e.g. 'parent will pay remaining next week'"
 rows={3}
 />
 </div>

 {/* ── Submit error ───────────────────────────────────────────── */}
 {errors.submit && (
 <div className="px-4 py-3 rounded-xl bg-err-soft border border-err/40 text-sm text-red-700 dark:text-red-300">
 {errors.submit}
 </div>
 )}

 {/* ── Submit ────────────────────────────────────────────────── */}
 <div className="pb-8">
 <Button
 type="submit"
 className="w-full py-3 text-base"
 disabled={uploading || recordMut.isPending || !currentPeriod}
 >
 {uploading ? (
 <span className="flex items-center gap-2">
 <UploadSimpleIcon size={16} className="animate-bounce" />
 Uploading receipt…
 </span>
 ) : recordMut.isPending ? (
 'Recording payment…'
 ) : (
 <span className="flex items-center gap-2">
 <ReceiptIcon size={16} weight="fill" />
 Record Payment
 </span>
 )}
 </Button>
 {!currentPeriod && (
 <p className="text-xs text-muted-foreground text-center mt-2">
 No active period found for this student. Ask an admin to create one.
 </p>
 )}
 </div>

 </form>
 )}
 </div>
 );
}
