'use client';

import { useMemo, useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Kicker } from '@/components/ui/typography';
import { MethodMix } from '@/components/dashboard/method-mix';
import { PayerTrend } from '@/components/dashboard/payer-trend';
import { RecentPayments } from '@/components/dashboard/recent-payments';
import { TeacherActivity } from '@/components/dashboard/teacher-activity';
import { Can, ROLE, useRole } from '@/components/auth/Can';
import { useStudentsQuery } from '@/hooks/useStudentsQuery';
import { usePaymentsQuery } from '@/hooks/usePaymentsQuery';
import { usePaymentPeriodsQuery } from '@/hooks/usePaymentPeriodsQuery';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import { STUDENT_STATUS, PAYMENT_STATUS, PERIOD_STATUS, MONTHS } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'warn' | 'err';
}

// Spec: rounded-2xl card, 20px padding, kicker label, 28px display value, 12px faint sub.
function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <Kicker>{label}</Kicker>
      <p
        className={cn(
          'text-[28px] font-semibold mt-2 tracking-[-0.4px] leading-none',
          accent === 'warn' && 'text-warn',
          accent === 'err' && 'text-err',
          !accent && 'text-foreground',
        )}
      >
        {value}
      </p>
      {sub && <p className="text-[12px] text-muted-foreground mt-2">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { data: currentUser } = useCurrentUserQuery();
  const { isAdmin, isTeacher } = useRole();

  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
  }, []);

  const month = (now ?? new Date()).getMonth() + 1;
  const year = (now ?? new Date()).getFullYear();

  const { data: students = [], isLoading: studentsLoading } = useStudentsQuery();
  const { data: payments = [], isLoading: paymentsLoading } = usePaymentsQuery();
  const { data: periods = [], isLoading: periodsLoading } = usePaymentPeriodsQuery({
    periodMonth: month,
    periodYear: year,
  });

  const isLoading = studentsLoading || paymentsLoading || periodsLoading;

  const stats = useMemo(() => {
    const activeStudents = students.filter((s) => s.status === STUDENT_STATUS.ACTIVE).length;
    const pendingPayments = payments.filter(
      (p) => p.status === PAYMENT_STATUS.PENDING_REVIEW,
    ).length;
    const verifiedThisMonth = payments
      .filter((p) => {
        if (p.status !== PAYMENT_STATUS.VERIFIED) return false;
        const d = new Date(p.paymentDate);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      })
      .reduce((sum, p) => sum + p.amount, 0);
    const overduePeriods = periods.filter((p) => p.status === PERIOD_STATUS.OVERDUE).length;
    return { activeStudents, pendingPayments, verifiedThisMonth, overduePeriods };
  }, [students, payments, periods, month, year]);

  const greeting = now
    ? now.getHours() < 12
      ? 'Good morning'
      : now.getHours() < 18
        ? 'Good afternoon'
        : 'Good evening'
    : 'Hello';
  const name = currentUser?.nickname ?? currentUser?.fullName?.split(' ')[0] ?? '';

  return (
    <div>
      <PageHeader
        kicker={`${MONTHS[month - 1]} ${year} · Iligan Branch`}
        title={`${greeting}${name ? `, ${name}` : ''}`}
        subtitle="Your operations snapshot for this month."
      />

      <div
        className={cn(
          'grid gap-3 lg:gap-4',
          isAdmin ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2',
        )}
      >
        {isLoading ? (
          Array.from({ length: isAdmin ? 4 : 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5">
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-32 mt-3" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              label={isTeacher ? 'My Students' : 'Active Students'}
              value={stats.activeStudents}
              sub={isTeacher ? 'assigned to you' : `${students.length} total enrolled`}
            />
            <Can role={ROLE.ADMIN}>
              <StatCard
                label="Pending Review"
                value={stats.pendingPayments}
                accent={stats.pendingPayments > 0 ? 'warn' : undefined}
                sub="payments awaiting action"
              />
            </Can>
            <StatCard
              label={`Collected (${MONTHS[month - 1]})`}
              value={`₱${stats.verifiedThisMonth.toLocaleString('en-PH')}`}
              sub={isTeacher ? 'your verified payments' : 'verified payments this month'}
            />
            <Can role={ROLE.ADMIN}>
              <StatCard
                label="Overdue Periods"
                value={stats.overduePeriods}
                accent={stats.overduePeriods > 0 ? 'err' : undefined}
                sub={`for ${MONTHS[month - 1]} ${year}`}
              />
            </Can>
          </>
        )}
      </div>

      <Can role={ROLE.ADMIN}>
        {!isLoading && stats.pendingPayments > 0 && (
          <div className="mt-6 rounded-2xl border border-warn/40 bg-warn-soft p-5">
            <Kicker className="text-warn mb-2">Action needed</Kicker>
            <p className="text-[15px] font-medium text-foreground tracking-[-0.1px]">
              {stats.pendingPayments} payment{stats.pendingPayments > 1 ? 's' : ''} waiting for
              review
            </p>
            <p className="text-[13px] text-muted-foreground mt-1">
              Go to{' '}
              <a
                href="/payments"
                className="text-primary font-medium underline-offset-2 hover:underline"
              >
                Payments
              </a>{' '}
              to verify, flag, or reject.
            </p>
          </div>
        )}
      </Can>

      <Can role={ROLE.ADMIN}>
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
          <MethodMix />
          <PayerTrend />
        </div>
      </Can>

      <div className="mt-4 lg:mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        <RecentPayments />
        <Can role={ROLE.ADMIN}>
          <TeacherActivity currentUserId={currentUser?.id} />
        </Can>
      </div>
    </div>
  );
}
