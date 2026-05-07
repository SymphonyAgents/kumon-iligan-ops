'use client';

import { useMemo, useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { useStudentsQuery } from '@/hooks/useStudentsQuery';
import { usePaymentsQuery } from '@/hooks/usePaymentsQuery';
import { usePaymentPeriodsQuery } from '@/hooks/usePaymentPeriodsQuery';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import { STUDENT_STATUS, PAYMENT_STATUS, PERIOD_STATUS } from '@/lib/constants';
import { MONTHS } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${color ?? 'text-zinc-900 dark:text-zinc-50'}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { data: currentUser } = useCurrentUserQuery();

  // Use state for time-sensitive values to avoid server/client hydration mismatch
  // (server renders in UTC, client renders in local timezone)
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); }, []);

  const month = (now ?? new Date()).getMonth() + 1;
  const year = (now ?? new Date()).getFullYear();

  const { data: students = [], isLoading: studentsLoading } = useStudentsQuery();
  const { data: payments = [], isLoading: paymentsLoading } = usePaymentsQuery();
  const { data: periods = [], isLoading: periodsLoading } = usePaymentPeriodsQuery({ periodMonth: month, periodYear: year });

  const isLoading = studentsLoading || paymentsLoading || periodsLoading;

  const stats = useMemo(() => {
    const activeStudents = students.filter(s => s.status === STUDENT_STATUS.ACTIVE).length;
    const pendingPayments = payments.filter(p => p.status === PAYMENT_STATUS.PENDING_REVIEW).length;
    const verifiedThisMonth = payments
      .filter(p => {
        if (p.status !== PAYMENT_STATUS.VERIFIED) return false;
        const d = new Date(p.paymentDate);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      })
      .reduce((sum, p) => sum + p.amount, 0);
    const overduePeriods = periods.filter(p => p.status === PERIOD_STATUS.OVERDUE).length;
    return { activeStudents, pendingPayments, verifiedThisMonth, overduePeriods };
  }, [students, payments, periods, month, year]);

  const greeting = now
    ? now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'
    : 'Hello';
  const name = currentUser?.nickname ?? currentUser?.fullName?.split(' ')[0] ?? '';

  return (
    <div>
      <PageHeader
        title={`${greeting}${name ? `, ${name}` : ''} 👋`}
        subtitle={`${MONTHS[month - 1]} ${year} — Kumon Iligan`}
      />

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              label="Active Students"
              value={stats.activeStudents}
              sub={`${students.length} total enrolled`}
            />
            <StatCard
              label="Pending Review"
              value={stats.pendingPayments}
              color={stats.pendingPayments > 0 ? 'text-amber-600 dark:text-amber-400' : undefined}
              sub="payments awaiting action"
            />
            <StatCard
              label={`Collected (${MONTHS[month - 1]})`}
              value={`₱${(stats.verifiedThisMonth).toLocaleString('en-PH')}`}
              sub="verified payments this month"
            />
            <StatCard
              label="Overdue Periods"
              value={stats.overduePeriods}
              color={stats.overduePeriods > 0 ? 'text-red-600 dark:text-red-400' : undefined}
              sub={`for ${MONTHS[month - 1]} ${year}`}
            />
          </>
        )}
      </div>

      {!isLoading && stats.pendingPayments > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {stats.pendingPayments} payment{stats.pendingPayments > 1 ? 's' : ''} waiting for review
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
            Go to <a href="/payments" className="underline font-medium">Payments</a> to verify, flag, or reject.
          </p>
        </div>
      )}
    </div>
  );
}
