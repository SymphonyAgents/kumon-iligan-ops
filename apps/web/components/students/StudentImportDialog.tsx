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
import { useFamiliesQuery } from '@/hooks/useFamiliesQuery';
import { STUDENTS_KEY } from '@/hooks/useStudentsQuery';
import { FAMILIES_KEY } from '@/hooks/useFamiliesQuery';
import { api } from '@/lib/api';
import {
  CloudArrowUpIcon,
  FileCsvIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  XIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface StudentImportDialogProps {
  open: boolean;
  onClose: () => void;
}

interface CsvRow {
  firstName: string;
  lastName: string;
  guardianName: string;
  guardianPhone: string;
  level?: string;
  enrollmentDate?: string;
}

interface ImportResult {
  ok: number;
  failed: { row: number; reason: string }[];
}

const REQUIRED_COLUMNS = ['firstName', 'lastName', 'guardianName', 'guardianPhone'] as const;
const OPTIONAL_COLUMNS = ['level', 'enrollmentDate'] as const;

const SAMPLE_CSV = `firstName,lastName,guardianName,guardianPhone,level,enrollmentDate
Quinn,Pascual,Maria Pascual,+639171234567,Level D,2026-01-15
Kira,Jimenez,Anna Jimenez,+639182345678,Level F,2026-02-01
Leo,Kalaw,Robert Kalaw,+639193456789,,2026-03-10
`;

function normalizeKey(k: string): string {
  return k.trim().toLowerCase().replace(/\s+/g, '');
}

function pickHeader(row: Record<string, string>, candidates: string[]): string | undefined {
  for (const k of Object.keys(row)) {
    const norm = normalizeKey(k);
    if (candidates.includes(norm)) return row[k];
  }
  return undefined;
}

function parseRow(
  raw: Record<string, string>,
): { ok: true; row: CsvRow } | { ok: false; reason: string } {
  const firstName = pickHeader(raw, ['firstname', 'first', 'givenname'])?.trim();
  const lastName = pickHeader(raw, ['lastname', 'last', 'surname', 'familyname'])?.trim();
  const guardianName = pickHeader(raw, [
    'guardianname',
    'guardian',
    'parent',
    'parentname',
  ])?.trim();
  const guardianPhone = pickHeader(raw, [
    'guardianphone',
    'phone',
    'parentphone',
    'contact',
  ])?.trim();
  const level = pickHeader(raw, ['level', 'kumonlevel'])?.trim() || undefined;
  const enrollmentDate =
    pickHeader(raw, ['enrollmentdate', 'enrolled', 'startdate'])?.trim() || undefined;

  if (!firstName) return { ok: false, reason: 'firstName is required' };
  if (!lastName) return { ok: false, reason: 'lastName is required' };
  if (!guardianName) return { ok: false, reason: 'guardianName is required' };
  if (!guardianPhone) return { ok: false, reason: 'guardianPhone is required' };

  return {
    ok: true,
    row: { firstName, lastName, guardianName, guardianPhone, level, enrollmentDate },
  };
}

export function StudentImportDialog({ open, onClose }: StudentImportDialogProps) {
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

  const { data: families = [] } = useFamiliesQuery();

  // Phone → familyId index, used to dedupe
  const phoneIndex = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of families) {
      if (f.guardianPhone) m.set(f.guardianPhone.trim(), f.id);
    }
    return m;
  }, [families]);

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setBusy(false);
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
          else errors.push({ row: i + 2, reason: parsed.reason }); // +2 = 1-index + header row
        });
        setPreview({ rows, errors });
      },
      error: (err) => {
        toast.error('Failed to parse CSV', { description: err.message });
      },
    });
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kumon-students-sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function runImport() {
    if (!preview || preview.rows.length === 0) return;
    setBusy(true);
    const localPhoneIndex = new Map(phoneIndex);
    const out: ImportResult = { ok: 0, failed: [...preview.errors] };
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < preview.rows.length; i++) {
      const r = preview.rows[i];
      try {
        let familyId = localPhoneIndex.get(r.guardianPhone.trim());
        if (!familyId) {
          const fam = await api.families.create({
            guardianName: r.guardianName,
            guardianPhone: r.guardianPhone,
          });
          familyId = fam.id;
          localPhoneIndex.set(r.guardianPhone.trim(), familyId);
        }
        await api.students.enroll({
          familyId,
          firstName: r.firstName,
          lastName: r.lastName,
          level: r.level,
          enrollmentDate: r.enrollmentDate || today,
        });
        out.ok += 1;
      } catch (err) {
        out.failed.push({
          row: i + 2,
          reason: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    void qc.invalidateQueries({ queryKey: STUDENTS_KEY });
    void qc.invalidateQueries({ queryKey: FAMILIES_KEY });
    setResult(out);
    setBusy(false);
    if (out.ok > 0) {
      toast.success(`Imported ${out.ok} student${out.ok > 1 ? 's' : ''}`, {
        description:
          out.failed.length > 0
            ? `${out.failed.length} row${out.failed.length > 1 ? 's' : ''} failed`
            : undefined,
      });
    }
  }

  function handleClose() {
    if (busy) return;
    reset();
    onClose();
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
          <DialogTitle>Import Students</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Info banner */}
          {!result && (
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <Kicker className="mb-2">CSV Format</Kicker>
              <p className="text-[13px] text-foreground mb-2 leading-relaxed">
                One student per row. The first row must contain column headers.
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
                <div>
                  <p className="text-muted-foreground/80 uppercase tracking-[0.1em] text-[10.5px] font-semibold mb-1">
                    Required
                  </p>
                  <ul className="space-y-0.5">
                    {REQUIRED_COLUMNS.map((c) => (
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
                    {OPTIONAL_COLUMNS.map((c) => (
                      <li key={c} className="font-mono text-muted-foreground">
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="text-[11.5px] text-muted-foreground mt-3 leading-relaxed">
                Families are matched by guardian phone — duplicates are reused, new ones are
                auto-created. If <span className="font-mono">enrollmentDate</span> is blank,
                today&apos;s date is used.
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

          {/* Drop zone */}
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

          {/* Validation errors */}
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

          {/* Result */}
          {result && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-status-paid-fg/30 bg-status-paid-bg p-4">
                <CheckCircleIcon size={22} weight="fill" className="text-status-paid-fg shrink-0" />
                <div>
                  <p className="text-[14px] font-semibold text-status-paid-fg">
                    Imported {result.ok} student{result.ok !== 1 ? 's' : ''}
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
