'use client';

import { useState, useRef, useMemo } from 'react';
import Papa from 'papaparse';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Kicker } from '@/components/ui/typography';
import { useStudentsQuery } from '@/hooks/useStudentsQuery';
import { PAYMENTS_KEY } from '@/hooks/usePaymentsQuery';
import { api } from '@/lib/api';
import { PAYMENT_METHOD } from '@/lib/constants';
import {
  CloudArrowUpIcon,
  FileCsvIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  XIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { PaymentMethod, Student } from '@/lib/types';

interface PaymentImportDialogProps {
  open: boolean;
  onClose: () => void;
}

interface CsvRow {
  studentName: string;
  guardianPhone?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  periodMonth: number;
  periodYear: number;
}

interface ImportResult {
  ok: number;
  failed: { row: number; reason: string }[];
}

const REQUIRED = [
  'studentName',
  'amount',
  'paymentDate',
  'paymentMethod',
  'periodMonth',
  'periodYear',
] as const;
const OPTIONAL = ['guardianPhone', 'referenceNumber'] as const;
const VALID_METHODS = Object.values(PAYMENT_METHOD) as PaymentMethod[];

function isPaymentMethod(value: string): value is PaymentMethod {
  return VALID_METHODS.includes(value as PaymentMethod);
}

const SAMPLE_CSV = `studentName,guardianPhone,amount,paymentDate,paymentMethod,referenceNumber,periodMonth,periodYear
Quinn Pascual,+639171234567,2500,2026-04-05,gcash,GC-9120384,4,2026
Kira Jimenez,+639182345678,2500,2026-04-12,gcash,GC-9120211,4,2026
Leo Kalaw,,3500,2026-04-15,bank_transfer,BPI-77231094,4,2026
`;

function normKey(k: string): string {
  return k.trim().toLowerCase().replace(/\s+/g, '');
}

function pick(row: Record<string, string>, candidates: string[]): string | undefined {
  for (const k of Object.keys(row)) {
    if (candidates.includes(normKey(k))) return row[k];
  }
  return undefined;
}

function parseRow(
  raw: Record<string, string>,
): { ok: true; row: CsvRow } | { ok: false; reason: string } {
  const studentName =
    pick(raw, ['studentname', 'name', 'student'])?.trim() ||
    [pick(raw, ['firstname', 'first']), pick(raw, ['lastname', 'last'])]
      .filter(Boolean)
      .join(' ')
      .trim();
  const guardianPhone = pick(raw, ['guardianphone', 'phone'])?.trim() || undefined;
  const amountStr = pick(raw, ['amount', 'paid', 'paymentamount']);
  const paymentDate = pick(raw, ['paymentdate', 'date', 'paidon'])?.trim();
  const method = pick(raw, ['paymentmethod', 'method'])?.trim().toLowerCase();
  const referenceNumber = pick(raw, ['referencenumber', 'reference', 'ref'])?.trim() || undefined;
  const monthStr = pick(raw, ['periodmonth', 'month'])?.trim();
  const yearStr = pick(raw, ['periodyear', 'year'])?.trim();

  if (!studentName) return { ok: false, reason: 'studentName is required' };
  if (!amountStr) return { ok: false, reason: 'amount is required' };
  const amount = parseFloat(amountStr);
  if (Number.isNaN(amount) || amount <= 0)
    return { ok: false, reason: 'amount must be a positive number' };

  if (!paymentDate || !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
    return { ok: false, reason: 'paymentDate must be YYYY-MM-DD' };
  }
  if (!method || !isPaymentMethod(method)) {
    return { ok: false, reason: `paymentMethod must be one of: ${VALID_METHODS.join(', ')}` };
  }

  const periodMonth = parseInt(monthStr ?? '', 10);
  const periodYear = parseInt(yearStr ?? '', 10);
  if (!periodMonth || periodMonth < 1 || periodMonth > 12) {
    return { ok: false, reason: 'periodMonth must be 1–12' };
  }
  if (!periodYear || periodYear < 2000 || periodYear > 2100) {
    return { ok: false, reason: 'periodYear must be a 4-digit year' };
  }

  return {
    ok: true,
    row: {
      studentName,
      guardianPhone,
      amount,
      paymentDate,
      paymentMethod: method,
      referenceNumber,
      periodMonth,
      periodYear,
    },
  };
}

function resolveStudent(
  row: CsvRow,
  students: Student[],
): { ok: true; student: Student } | { ok: false; reason: string } {
  const target = row.studentName.trim().toLowerCase();
  const phoneNorm = row.guardianPhone?.replace(/\s+/g, '');

  const matches = students.filter((s) => {
    const full = `${s.firstName} ${s.lastName}`.trim().toLowerCase();
    return full === target;
  });

  if (matches.length === 0) {
    return { ok: false, reason: `student "${row.studentName}" not found` };
  }
  if (matches.length === 1) {
    return { ok: true, student: matches[0] };
  }
  // Disambiguate by guardian phone
  if (phoneNorm) {
    const phoneMatch = matches.find((s) => s.guardianPhone?.replace(/\s+/g, '') === phoneNorm);
    if (phoneMatch) return { ok: true, student: phoneMatch };
  }
  return {
    ok: false,
    reason: `${matches.length} students match "${row.studentName}" — add guardianPhone to disambiguate`,
  };
}

export function PaymentImportDialog({ open, onClose }: PaymentImportDialogProps) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    rows: CsvRow[];
    errors: { row: number; reason: string }[];
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const { data: students = [] } = useStudentsQuery({ status: 'active' });

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setBusy(false);
  }

  function handleClose() {
    if (busy) return;
    reset();
    onClose();
  }

  function handleSelect(f: File | null | undefined) {
    setResult(null);
    if (!f) return;
    if (!/\.csv$/i.test(f.name)) {
      toast.error('Please select a .csv file');
      return;
    }
    setFile(f);
    Papa.parse<Record<string, string>>(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows: CsvRow[] = [];
        const errors: { row: number; reason: string }[] = [];
        res.data.forEach((raw, i) => {
          const parsed = parseRow(raw);
          if (parsed.ok) rows.push(parsed.row);
          else errors.push({ row: i + 2, reason: parsed.reason });
        });
        setPreview({ rows, errors });
      },
      error: (err) => toast.error('Failed to parse CSV', { description: err.message }),
    });
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kumon-payments-sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function runImport() {
    if (!preview || preview.rows.length === 0) return;
    setBusy(true);
    const out: ImportResult = { ok: 0, failed: [...preview.errors] };

    for (let i = 0; i < preview.rows.length; i++) {
      const r = preview.rows[i];
      const csvRowNum = i + 2;
      try {
        // 1. Resolve student
        const resolved = resolveStudent(r, students);
        if (!resolved.ok) {
          out.failed.push({ row: csvRowNum, reason: resolved.reason });
          continue;
        }
        // 2. Resolve period
        const periods = await api.paymentPeriods.list({
          studentId: resolved.student.id,
          periodMonth: r.periodMonth,
          periodYear: r.periodYear,
        });
        const period = periods[0];
        if (!period) {
          out.failed.push({
            row: csvRowNum,
            reason: `no payment_period for ${r.periodMonth}/${r.periodYear} — bulk-generate first`,
          });
          continue;
        }
        // 3. Record payment (status defaults to pending_review on backend)
        await api.payments.record({
          studentId: resolved.student.id,
          periodId: period.id,
          amount: Math.round(r.amount * 100),
          paymentMethod: r.paymentMethod,
          referenceNumber: r.referenceNumber ?? '',
          receiptImageUrl: '',
          paymentDate: r.paymentDate,
        });
        out.ok += 1;
      } catch (err) {
        out.failed.push({
          row: csvRowNum,
          reason: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    void qc.invalidateQueries({ queryKey: PAYMENTS_KEY });
    void qc.invalidateQueries({ queryKey: ['payment-periods'] });
    setResult(out);
    setBusy(false);
    if (out.ok > 0) {
      toast.success(`Imported ${out.ok} payment${out.ok > 1 ? 's' : ''}`, {
        description:
          out.failed.length > 0
            ? `${out.failed.length} row${out.failed.length > 1 ? 's' : ''} failed`
            : undefined,
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Payments</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {!result && (
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <Kicker className="mb-2">CSV Format</Kicker>
              <p className="text-[13px] text-foreground mb-3 leading-relaxed">
                One payment per row. The first row must contain column headers. Imported payments
                land as <span className="font-mono text-[12px]">pending_review</span> so admin can
                still verify them.
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
                <div>
                  <p className="text-muted-foreground/80 uppercase tracking-[0.1em] text-[10.5px] font-semibold mb-1">
                    Required
                  </p>
                  <ul className="space-y-0.5">
                    {REQUIRED.map((c) => (
                      <li key={c} className="font-mono text-foreground">
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-muted-foreground/80 uppercase tracking-[0.1em] text-[10.5px] font-semibold mb-1">
                    Optional
                  </p>
                  <ul className="space-y-0.5">
                    {OPTIONAL.map((c) => (
                      <li key={c} className="font-mono text-muted-foreground">
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="text-[11.5px] text-muted-foreground mt-3 leading-relaxed">
                Students are matched by name; add <span className="font-mono">guardianPhone</span>{' '}
                if two students share a name. Payment periods must already exist — bulk-generate
                them on the Periods page first if a row fails with &quot;no payment_period&quot;.{' '}
                <span className="font-mono">paymentMethod</span> values:{' '}
                <span className="font-mono">{VALID_METHODS.join(', ')}</span>.
              </p>
              <button
                type="button"
                onClick={downloadSample}
                className="text-[12px] font-medium text-primary hover:underline mt-3"
              >
                Download sample CSV
              </button>
            </div>
          )}

          {!result && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleSelect(f);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-colors py-8 px-4',
                dragOver
                  ? 'border-primary bg-accent-soft'
                  : file
                    ? 'border-primary/40 bg-accent-soft/40'
                    : 'border-border-strong bg-card hover:bg-secondary/30',
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => handleSelect(e.target.files?.[0])}
              />
              {file ? (
                <div className="flex items-center gap-3">
                  <FileCsvIcon size={28} weight="duotone" className="text-primary" />
                  <div className="text-center">
                    <p className="text-[14px] font-medium text-foreground">{file.name}</p>
                    {preview && (
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        {preview.rows.length} valid row{preview.rows.length !== 1 ? 's' : ''}
                        {preview.errors.length > 0 &&
                          ` · ${preview.errors.length} error${preview.errors.length > 1 ? 's' : ''}`}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      reset();
                    }}
                    className="ml-2 p-1 rounded text-muted-foreground hover:text-err"
                    aria-label="Remove file"
                  >
                    <XIcon size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <CloudArrowUpIcon
                    size={32}
                    weight="duotone"
                    className="text-muted-foreground mb-2"
                  />
                  <p className="text-[14px] font-medium text-foreground">Drop a .csv file here</p>
                  <p className="text-[12px] text-muted-foreground mt-1">or click to browse</p>
                </>
              )}
            </div>
          )}

          {!result && preview && preview.errors.length > 0 && (
            <div className="rounded-xl border border-warn/40 bg-warn-soft p-3">
              <Kicker className="text-warn mb-1">Skipped rows</Kicker>
              <ul className="text-[12px] text-foreground space-y-0.5 max-h-32 overflow-y-auto">
                {preview.errors.slice(0, 10).map((e, i) => (
                  <li key={i}>
                    Row {e.row} — <span className="text-muted-foreground">{e.reason}</span>
                  </li>
                ))}
                {preview.errors.length > 10 && (
                  <li className="text-muted-foreground">…and {preview.errors.length - 10} more</li>
                )}
              </ul>
            </div>
          )}

          {result && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-status-paid-fg/30 bg-status-paid-bg p-4">
                <CheckCircleIcon size={22} weight="fill" className="text-status-paid-fg shrink-0" />
                <div>
                  <p className="text-[14px] font-semibold text-status-paid-fg">
                    Imported {result.ok} payment{result.ok !== 1 ? 's' : ''}
                  </p>
                  {result.failed.length > 0 && (
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                      {result.failed.length} row{result.failed.length !== 1 ? 's' : ''} failed
                    </p>
                  )}
                </div>
              </div>
              {result.failed.length > 0 && (
                <div className="rounded-xl border border-err/30 bg-err-soft p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <WarningCircleIcon size={14} weight="fill" className="text-err" />
                    <Kicker className="text-err">Failed rows</Kicker>
                  </div>
                  <ul className="text-[12px] text-foreground space-y-0.5 max-h-40 overflow-y-auto">
                    {result.failed.map((e, i) => (
                      <li key={i}>
                        Row {e.row} — <span className="text-muted-foreground">{e.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={busy}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button
              type="button"
              onClick={runImport}
              disabled={!preview || preview.rows.length === 0 || busy}
            >
              {busy ? 'Importing…' : preview ? `Import ${preview.rows.length}` : 'Import'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
