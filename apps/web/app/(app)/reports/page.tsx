'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePaymentsQuery } from '@/hooks/usePaymentsQuery';
import { usePaymentPeriodsQuery } from '@/hooks/usePaymentPeriodsQuery';
import { useStudentsQuery } from '@/hooks/useStudentsQuery';
import {
  PERIOD_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  MONTHS,
  STUDENT_STATUS,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  WarningCircleIcon,
  ArrowRightIcon,
  CurrencyCircleDollarIcon,
  ClockCountdownIcon,
  CheckCircleIcon,
} from '@phosphor-icons/react';

function fmt(amount: number) {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;
}

function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex gap-3">
      <div
        className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
          accent ?? 'bg-secondary',
        )}
      >
        <Icon size={18} weight="fill" className={accent ? 'text-white' : 'text-muted-foreground'} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-xl font-bold text-foreground leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function CollectionBar({
  paid,
  partial,
  overdue,
  total,
}: {
  paid: number;
  partial: number;
  overdue: number;
  total: number;
}) {
  const paidPct = total > 0 ? (paid / total) * 100 : 0;
  const partialPct = total > 0 ? (partial / total) * 100 : 0;
  const overduePct = total > 0 ? (overdue / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-foreground">Payment status breakdown</p>
        <p className="text-sm font-bold text-status-paid-fg">{Math.round(paidPct)}% collected</p>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden bg-secondary gap-px">
        {paidPct > 0 && <div style={{ width: `${paidPct}%` }} className="bg-status-paid-dot" />}
        {partialPct > 0 && <div style={{ width: `${partialPct}%` }} className="bg-amber-400" />}
        {overduePct > 0 && <div style={{ width: `${overduePct}%` }} className="bg-err" />}
      </div>
      <div className="flex flex-wrap gap-3 mt-2">
        {[
          { color: 'bg-status-paid-dot', label: 'Paid', count: paid, pct: paidPct },
          { color: 'bg-amber-400', label: 'Partial', count: partial, pct: partialPct },
          { color: 'bg-err', label: 'Overdue', count: overdue, pct: overduePct },
        ].map(({ color, label, count, pct }) => (
          <span key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn('w-2 h-2 rounded-full', color)} />
            {label} <span className="font-semibold text-foreground">{count}</span>
            <span className="text-muted-foreground">({Math.round(pct)}%)</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function MethodBreakdown({ payments }: { payments: ReturnType<typeof usePaymentsQuery>['data'] }) {
  const list = payments ?? [];
  const verified = list.filter((p) => p.status === PAYMENT_STATUS.VERIFIED);
  const total = verified.length;
  const counts: Record<string, number> = {};
  verified.forEach((p) => {
    counts[p.paymentMethod] = (counts[p.paymentMethod] ?? 0) + 1;
  });

  const METHODS: Record<string, { dot: string; label: string }> = {
    [PAYMENT_METHOD.GCASH]: { dot: 'bg-primary', label: 'GCash' },
    [PAYMENT_METHOD.BANK_TRANSFER]: { dot: 'bg-violet-500', label: 'Bank Transfer' },
    [PAYMENT_METHOD.CASH]: { dot: 'bg-status-paid-dot', label: 'Cash' },
    [PAYMENT_METHOD.OTHER]: { dot: 'bg-secondary', label: 'Other' },
  };

  return (
    <div>
      <p className="text-sm font-semibold text-foreground mb-3">Payment methods (verified)</p>
      {total === 0 ? (
        <p className="text-xs text-muted-foreground">No verified payments yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {Object.entries(METHODS)
            .filter(([m]) => (counts[m] ?? 0) > 0)
            .sort(([a], [b]) => (counts[b] ?? 0) - (counts[a] ?? 0))
            .map(([method, { dot, label }]) => {
              const count = counts[method] ?? 0;
              const pct = (count / total) * 100;
              return (
                <div key={method}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1.5 text-xs text-foreground">
                      <span className={cn('w-2 h-2 rounded-full', dot)} />
                      {label}
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {count} <span className="text-muted-foreground">({Math.round(pct)}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
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
  const [year, setYear] = useState(now.getFullYear());

  const { data: students = [], isLoading: sLoad } = useStudentsQuery({
    status: STUDENT_STATUS.ACTIVE,
  });
  const { data: periods = [], isLoading: pLoad } = usePaymentPeriodsQuery({
    periodMonth: month,
    periodYear: year,
  });
  const { data: payments = [], isLoading: paLoad } = usePaymentsQuery();
  const isLoading = sLoad || pLoad || paLoad;

  const stats = useMemo(() => {
    const totalStudents = students.length;
    const paid = periods.filter((p) => p.status === PERIOD_STATUS.PAID).length;
    const partial = periods.filter((p) => p.status === PERIOD_STATUS.PARTIAL).length;
    const overdue = periods.filter(
      (p) => p.status === PERIOD_STATUS.OVERDUE || p.status === PERIOD_STATUS.PENDING,
    ).length;
    const pendingReview = payments.filter((p) => p.status === PAYMENT_STATUS.PENDING_REVIEW).length;
    const verifiedThisMonth = payments
      .filter((p) => {
        if (p.status !== PAYMENT_STATUS.VERIFIED) return false;
        const d = new Date(p.paymentDate);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      })
      .reduce((sum, p) => sum + p.amount, 0);
    return { totalStudents, paid, partial, overdue, pendingReview, verifiedThisMonth };
  }, [students, periods, payments, month, year]);

  // Missing payment list
  const studentPeriodMap = useMemo(() => new Map(periods.map((p) => [p.studentId, p])), [periods]);
  const unpaid = useMemo(
    () =>
      students.filter((s) => {
        const p = studentPeriodMap.get(s.id);
        return !p || p.status === PERIOD_STATUS.OVERDUE || p.status === PERIOD_STATUS.PENDING;
      }),
    [students, studentPeriodMap],
  );

  const years = [year - 1, year, year + 1];

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Payment collection overview"
        action={
          <div className="flex items-center gap-2">
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {String(y)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KPICard
            icon={CurrencyCircleDollarIcon}
            label={`Collected (${MONTHS[month - 1]})`}
            value={fmt(stats.verifiedThisMonth)}
            sub="verified payments"
            accent="bg-status-paid-dot"
          />
          <KPICard
            icon={CheckCircleIcon}
            label="Students paid"
            value={`${stats.paid} / ${stats.totalStudents}`}
            sub={`${stats.totalStudents > 0 ? Math.round((stats.paid / stats.totalStudents) * 100) : 0}% collection rate`}
          />
          <KPICard
            icon={ClockCountdownIcon}
            label="Pending review"
            value={stats.pendingReview}
            sub="awaiting action"
            accent={stats.pendingReview > 0 ? 'bg-amber-500' : undefined}
          />
          <KPICard
            icon={WarningCircleIcon}
            label="Unpaid / overdue"
            value={stats.overdue}
            sub={`${MONTHS[month - 1]} ${year}`}
            accent={stats.overdue > 0 ? 'bg-err' : undefined}
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          {isLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <CollectionBar
              paid={stats.paid}
              partial={stats.partial}
              overdue={stats.overdue}
              total={stats.totalStudents}
            />
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          {isLoading ? <Skeleton className="h-24" /> : <MethodBreakdown payments={payments} />}
        </div>
      </div>

      {/* Pending alert */}
      {!isLoading && stats.pendingReview > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-warn-soft border border-warn/40 mb-4">
          <ClockCountdownIcon size={18} weight="fill" className="text-warn shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200 flex-1 font-medium">
            {stats.pendingReview} payment{stats.pendingReview > 1 ? 's' : ''} waiting for review —
            not counted in totals until verified.
          </p>
          <Link
            href="/payments"
            className="flex items-center gap-1 text-xs font-semibold text-warn hover:underline shrink-0"
          >
            Review <ArrowRightIcon size={12} />
          </Link>
        </div>
      )}

      {/* Missing payments */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Missing payments</p>
            {!isLoading && unpaid.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                {unpaid.length}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {MONTHS[month - 1]} {year}
          </p>
        </div>

        {isLoading ? (
          <Skeleton className="h-48 rounded-xl" />
        ) : unpaid.length === 0 ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-status-paid-fg/40">
            <CheckCircleIcon size={18} weight="fill" className="text-status-paid-dot" />
            <p className="text-sm text-status-paid-fg font-medium">
              All students have a verified payment for {MONTHS[month - 1]} {year} 🎉
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-err/40 overflow-hidden divide-y divide-red-100 dark:divide-red-900/50">
            {unpaid.slice(0, 12).map((s) => {
              const period = studentPeriodMap.get(s.id);
              return (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3 bg-card">
                  <div className="w-8 h-8 rounded-full bg-err-soft flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-err">
                      {s.firstName?.[0]}
                      {s.lastName?.[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {s.firstName} {s.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {s.guardianName} · {s.level ?? 'No level'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {period ? (
                      <>
                        <StatusBadge status={period.status} />
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {fmt(period.expectedAmount - period.paidAmount)} due
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">No period</span>
                    )}
                  </div>
                </div>
              );
            })}
            {unpaid.length > 12 && (
              <div className="px-4 py-3 bg-secondary/40 text-xs text-muted-foreground text-center">
                +{unpaid.length - 12} more
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
