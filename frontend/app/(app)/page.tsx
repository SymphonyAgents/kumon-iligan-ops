'use client';

import { useMemo, useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Kicker } from '@/components/ui/typography';
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

 const [now, setNow] = useState<Date | null>(null);
 useEffect(() => {
 setNow(new Date());
 }, []);

 const month = (now ?? new Date()).getMonth() + 1;
 const year = (now ?? new Date()).getFullYear();

 const { data: students = [], isLoading: studentsLoading } = useStudentsQuery();
 const { data: payments = [], isLoading: paymentsLoading } = usePaymentsQuery();
 const { data: periods = [], isLoading: periodsLoading } = usePaymentPeriodsQuery({
 periodMonth: month, periodYear: year, });

 const isLoading = studentsLoading || paymentsLoading || periodsLoading;

 const stats = useMemo(() => {
 const activeStudents = students.filter((s) => s.status === STUDENT_STATUS.ACTIVE).length;
 const pendingPayments = payments.filter((p) => p.status === PAYMENT_STATUS.PENDING_REVIEW).length;
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

 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
 {isLoading ? (
 Array.from({ length: 4 }).map((_, i) => (
 <div key={i} className="rounded-2xl border border-border bg-card p-5" >
 <Skeleton className="h-3 w-24 mb-3" />
 <Skeleton className="h-7 w-16" />
 <Skeleton className="h-3 w-32 mt-3" />
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
 accent={stats.pendingPayments > 0 ? 'warn' : undefined}
 sub="payments awaiting action"
 />
 <StatCard
 label={`Collected (${MONTHS[month - 1]})`}
 value={`₱${stats.verifiedThisMonth.toLocaleString('en-PH')}`}
 sub="verified payments this month"
 />
 <StatCard
 label="Overdue Periods"
 value={stats.overduePeriods}
 accent={stats.overduePeriods > 0 ? 'err' : undefined}
 sub={`for ${MONTHS[month - 1]} ${year}`}
 />
 </>
 )}
 </div>

 {!isLoading && stats.pendingPayments > 0 && (
 <div className="mt-6 rounded-2xl border border-warn/40 bg-warn-soft p-5">
 <Kicker className="text-warn mb-2">Action needed</Kicker>
 <p className="text-[15px] font-medium text-foreground tracking-[-0.1px]">
 {stats.pendingPayments} payment{stats.pendingPayments > 1 ? 's' : ''} waiting for review
 </p>
 <p className="text-[13px] text-muted-foreground mt-1">
 Go to{' '}
          <a href="/payments" className="text-primary font-medium underline-offset-2 hover:underline">
            Payments
          </a>{' '}
          to verify, flag, or reject.
        </p>
 </div>
 )}
 </div>
 );
}
