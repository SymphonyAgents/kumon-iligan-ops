'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { usePaymentsQuery } from '@/hooks/usePaymentsQuery';
import { usePaymentPeriodsQuery } from '@/hooks/usePaymentPeriodsQuery';
import { useStudentsQuery } from '@/hooks/useStudentsQuery';
import { PERIOD_STATUS, PAYMENT_STATUS, PAYMENT_METHOD, MONTHS, STUDENT_STATUS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  WarningCircleIcon,
  ArrowRightIcon,
  CurrencyCircleDollarIcon,
  ClockCountdownIcon,
  CheckCircleIcon,
} from '@phosphor-icons/react';

function fmt(amount: number) {
  return `₱${(amount / 100).toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;
}

function KPICard({
  icon: Icon, label, value, sub, accent,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 flex gap-3">
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', accent ?? 'bg-zinc-100 dark:bg-zinc-800')}>
        <Icon size={18} weight="fill" className={accent ? 'text-white' : 'text-zinc-500'} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{label}</p>
        <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function CollectionBar({ paid, partial, overdue, total }: { paid: number; partial: number; overdue: number; total: number }) {
  const paidPct    = total > 0 ? (paid    / total) * 100 : 0;
  const partialPct = total > 0 ? (partial / total) * 100 : 0;
  const overduePct = total > 0 ? (overdue / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Payment status breakdown</p>
        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{Math.round(paidPct)}% collected</p>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 gap-px">
        {paidPct > 0    && <div style={{ width: `${paidPct}%` }}    className="bg-emerald-500" />}
        {partialPct > 0 && <div style={{ width: `${partialPct}%` }} className="bg-amber-400" />}
        {overduePct > 0 && <div style={{ width: `${overduePct}%` }} className="bg-red-500" />}
      </div>
      <div className="flex flex-wrap gap-3 mt-2">
        {[
          { color: 'bg-emerald-500', label: 'Paid',    count: paid,    pct: paidPct },
          { color: 'bg-amber-400',   label: 'Partial', count: partial, pct: partialPct },
          { color: 'bg-red-500',     label: 'Overdue', count: overdue, pct: overduePct },
        ].map(({ color, label, count, pct }) => (
          <span key={label} className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span className={cn('w-2 h-2 rounded-full', color)} />
            {label} <span className="font-semibold text-zinc-700 dark:text-zinc-300">{count}</span>
            <span className="text-zinc-400">({Math.round(pct)}%)</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function MethodBreakdown({ payments }: { payments: ReturnType<typeof usePaymentsQuery>['data'] }) {
  const list     = payments ?? [];
  const verified = list.filter(p => p.status === PAYMENT_STATUS.VERIFIED);
  const total    = verified.length;
  const counts: Record<string, number> = {};
  verified.forEach(p => { counts[p.paymentMethod] = (counts[p.paymentMethod] ?? 0) + 1; });

  const METHODS: Record<string, { dot: string; label: string }> = {
    [PAYMENT_METHOD.GCASH]:         { dot: 'bg-blue-500',    label: 'GCash' },
    [PAYMENT_METHOD.BANK_TRANSFER]: { dot: 'bg-violet-500',  label: 'Bank Transfer' },
    [PAYMENT_METHOD.CASH]:          { dot: 'bg-emerald-500', label: 'Cash' },
    [PAYMENT_METHOD.OTHER]:         { dot: 'bg-zinc-400',    label: 'Other' },
  };

  return (
    <div>
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Payment methods (verified)</p>
      {total === 0 ? (
        <p className="text-xs text-zinc-400">No verified payments yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {Object.entries(METHODS)
            .filter(([m]) => (counts[m] ?? 0) > 0)
            .sort(([a], [b]) => (counts[b] ?? 0) - (counts[a] ?? 0))
            .map(([method, { dot, label }]) => {
              const count = counts[method] ?? 0;
              const pct   = (count / total) * 100;
              return (
                <div key={method}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                      <span className={cn('w-2 h-2 rounded-full', dot)} />
                      {label}
                    </span>
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {count} <span className="text-zinc-400">({Math.round(pct)}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div style={{ width: `${pct}%` }} className={cn('h-full rounded-full', dot)} />
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());

  const { data: students = [], isLoading: sLoad } = useStudentsQuery({ status: STUDENT_STATUS.ACTIVE });
  const { data: periods  = [], isLoading: pLoad } = usePaymentPeriodsQuery({ periodMonth: month, periodYear: year });
  const { data: payments = [], isLoading: paLoad } = usePaymentsQuery();
  const isLoading = sLoad || pLoad || paLoad;

  const stats = useMemo(() => {
    const totalStudents = students.length;
    const paid    = periods.filter(p => p.status === PERIOD_STATUS.PAID).length;
    const partial = periods.filter(p => p.status === PERIOD_STATUS.PARTIAL).length;
    const overdue = periods.filter(p => p.status === PERIOD_STATUS.OVERDUE || p.status === PERIOD_STATUS.PENDING).length;
    const pendingReview = payments.filter(p => p.status === PAYMENT_STATUS.PENDING_REVIEW).length;
    const verifiedThisMonth = payments
      .filter(p => {
        if (p.status !== PAYMENT_STATUS.VERIFIED) return false;
        const d = new Date(p.paymentDate);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      })
      .reduce((sum, p) => sum + p.amount, 0);
    return { totalStudents, paid, partial, overdue, pendingReview, verifiedThisMonth };
  }, [students, periods, payments, month, year]);

  // Missing payment list
  const studentPeriodMap = useMemo(
    () => new Map(periods.map(p => [p.studentId, p])),
    [periods],
  );
  const unpaid = useMemo(() => students.filter(s => {
    const p = studentPeriodMap.get(s.id);
    return !p || p.status === PERIOD_STATUS.OVERDUE || p.status === PERIOD_STATUS.PENDING;
  }), [students, studentPeriodMap]);

  const years = [year - 1, year, year + 1];

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Payment collection overview"
        action={
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="px-3 py-1.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none"
            >
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="px-3 py-1.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        }
      />

      {/* KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KPICard icon={CurrencyCircleDollarIcon} label={`Collected (${MONTHS[month - 1]})`} value={fmt(stats.verifiedThisMonth)} sub="verified payments" accent="bg-emerald-500" />
          <KPICard icon={CheckCircleIcon} label="Students paid" value={`${stats.paid} / ${stats.totalStudents}`} sub={`${stats.totalStudents > 0 ? Math.round((stats.paid / stats.totalStudents) * 100) : 0}% collection rate`} />
          <KPICard icon={ClockCountdownIcon} label="Pending review" value={stats.pendingReview} sub="awaiting action" accent={stats.pendingReview > 0 ? 'bg-amber-500' : undefined} />
          <KPICard icon={WarningCircleIcon} label="Unpaid / overdue" value={stats.overdue} sub={`${MONTHS[month - 1]} ${year}`} accent={stats.overdue > 0 ? 'bg-red-500' : undefined} />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
          {isLoading ? <Skeleton className="h-24" /> : <CollectionBar paid={stats.paid} partial={stats.partial} overdue={stats.overdue} total={stats.totalStudents} />}
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
          {isLoading ? <Skeleton className="h-24" /> : <MethodBreakdown payments={payments} />}
        </div>
      </div>

      {/* Pending alert */}
      {!isLoading && stats.pendingReview > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 mb-4">
          <ClockCountdownIcon size={18} weight="fill" className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200 flex-1 font-medium">
            {stats.pendingReview} payment{stats.pendingReview > 1 ? 's' : ''} waiting for review — not counted in totals until verified.
          </p>
          <Link href="/payments" className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline shrink-0">
            Review <ArrowRightIcon size={12} />
          </Link>
        </div>
      )}

      {/* Missing payments */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Missing payments</p>
            {!isLoading && unpaid.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">{unpaid.length}</span>
            )}
          </div>
          <p className="text-xs text-zinc-400">{MONTHS[month - 1]} {year}</p>
        </div>

        {isLoading ? (
          <Skeleton className="h-48 rounded-xl" />
        ) : unpaid.length === 0 ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
            <CheckCircleIcon size={18} weight="fill" className="text-emerald-500" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
              All students have a verified payment for {MONTHS[month - 1]} {year} 🎉
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-red-200 dark:border-red-900 overflow-hidden divide-y divide-red-100 dark:divide-red-900/50">
            {unpaid.slice(0, 12).map(s => {
              const period = studentPeriodMap.get(s.id);
              return (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-950">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                      {s.firstName?.[0]}{s.lastName?.[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-zinc-400 truncate">{s.guardianName} · {s.level ?? 'No level'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {period
                      ? <><StatusBadge status={period.status} /><p className="text-xs text-zinc-400 mt-0.5">{fmt(period.expectedAmount - period.paidAmount)} due</p></>
                      : <span className="text-xs text-zinc-400">No period</span>
                    }
                  </div>
                </div>
              );
            })}
            {unpaid.length > 12 && (
              <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-400 text-center">+{unpaid.length - 12} more</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
