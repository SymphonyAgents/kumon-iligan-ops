'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Kicker } from '@/components/ui/typography';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterChip } from '@/components/ui/filter-chip';
import { useStudentsQuery } from '@/hooks/useStudentsQuery';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import { PERIOD_STATUS, MONTHS, STUDENT_STATUS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { MagnifyingGlassIcon, CaretRightIcon } from '@phosphor-icons/react';
import type { Student } from '@/lib/types';

const PERIOD_DOT: Record<string, string> = {
 [PERIOD_STATUS.PAID]: 'bg-status-paid-dot',
 [PERIOD_STATUS.PARTIAL]: 'bg-status-partial-dot',
 [PERIOD_STATUS.OVERDUE]: 'bg-status-unpaid-dot',
 [PERIOD_STATUS.PENDING]: 'bg-status-pending-dot',
};

function fmt(amount: number) {
 return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;
}

function StudentCard({ student }: { student: Student }) {
 const period = student.currentPeriod;
 const status = period?.status ?? 'none';
 const dotColor = PERIOD_DOT[status];
 const remaining = period ? Math.max(0, period.expectedAmount - period.paidAmount) : null;
 const initials = `${student.firstName?.[0] ?? ''}${student.lastName?.[0] ?? ''}`.toUpperCase();

 return (
 <Link
 href={`/sdc/${student.id}`}
 className="flex items-center gap-3 px-[14px] py-3 bg-card border border-border rounded-[10px] hover:bg-secondary/40 transition-colors active:scale-[0.99]"
 >
 <div className="relative shrink-0 w-10 h-10 rounded-full bg-accent-soft text-accent-foreground flex items-center justify-center">
 <span className="text-xs font-semibold">{initials}</span>
 {dotColor && (
 <span
 className={cn(
 'absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-card',
 dotColor,
 )}
 />
 )}
 </div>

 <div className="flex-1 min-w-0">
 <p className="text-[14px] font-medium text-foreground tracking-[-0.1px] truncate">
 {student.firstName} {student.lastName}
 </p>
 <p className="text-[12px] text-muted-foreground truncate mt-0.5">
 {student.guardianName ?? '—'}
 {student.level ? <> · <span>{student.level}</span></> : null}
 </p>
 </div>

 <div className="shrink-0 text-right">
 {period ? (
 <>
 {status === PERIOD_STATUS.PAID ? (
 <p className="text-[12px] font-medium text-status-paid-fg">Paid ✓</p>
 ) : remaining !== null ? (
 <p
 className={cn(
 'text-[13px] font-semibold tracking-[-0.1px]',
 status === PERIOD_STATUS.OVERDUE ? 'text-err' : 'text-warn',
 )}
 >
 {fmt(remaining)} due
 </p>
 ) : null}
 <p className="text-[10.5px] text-muted-foreground/80 mt-0.5">
 {MONTHS[(period.periodMonth ?? 1) - 1]} {period.periodYear}
 </p>
 </>
 ) : (
 <p className="text-[12px] text-muted-foreground/60">No period</p>
 )}
 </div>

 <CaretRightIcon size={14} className="shrink-0 text-muted-foreground/50" />
 </Link>
 );
}

function SummaryBar({ students }: { students: Student[] }) {
 const total = students.length;
 const paid = students.filter(s => s.currentPeriod?.status === PERIOD_STATUS.PAID).length;
 const partial = students.filter(s => s.currentPeriod?.status === PERIOD_STATUS.PARTIAL).length;
 const overdue = students.filter(
 s => s.currentPeriod?.status === PERIOD_STATUS.OVERDUE || s.currentPeriod?.status === PERIOD_STATUS.PENDING,
 ).length;

 const cells: Array<{ label: string; value: number; tone: string }> = [
 { label: 'Students', value: total, tone: 'text-foreground' },
 { label: 'Paid', value: paid, tone: 'text-status-paid-fg' },
 { label: 'Partial', value: partial, tone: 'text-warn' },
 { label: 'Unpaid', value: overdue, tone: 'text-err' },
 ];

 return (
 <div className="grid grid-cols-4 gap-2 mb-4">
 {cells.map(({ label, value, tone }) => (
 <div key={label} className="rounded-[10px] border border-border bg-card px-3 py-3 text-center">
 <p className={cn('text-[22px] font-semibold leading-none tracking-[-0.3px]', tone)}>
 {value}
 </p>
 <p className="text-[10.5px] text-muted-foreground mt-1.5 uppercase tracking-[0.1em] font-medium">
 {label}
 </p>
 </div>
 ))}
 </div>
 );
}

const FILTER_TABS = [
 { label: 'All', value: '' },
 { label: 'Unpaid', value: 'unpaid' },
 { label: 'Partial', value: PERIOD_STATUS.PARTIAL },
 { label: 'Paid', value: PERIOD_STATUS.PAID },
];

export default function SDCPage() {
 const [search, setSearch] = useState('');
 const [statusFilter, setFilter] = useState('');

 const { data: currentUser } = useCurrentUserQuery();
 const now = new Date();

 const { data: students = [], isLoading } = useStudentsQuery({
 status: STUDENT_STATUS.ACTIVE,
 ...(currentUser?.id ? { teacherId: currentUser.id } : {}),
 });

 const counts = useMemo(() => {
 const paid = students.filter(s => s.currentPeriod?.status === PERIOD_STATUS.PAID).length;
 const partial = students.filter(s => s.currentPeriod?.status === PERIOD_STATUS.PARTIAL).length;
 const unpaid = students.filter(
 s => s.currentPeriod?.status === PERIOD_STATUS.OVERDUE || s.currentPeriod?.status === PERIOD_STATUS.PENDING || !s.currentPeriod,
 ).length;
 return { all: students.length, paid, partial, unpaid };
 }, [students]);

 const filtered = useMemo(() => {
 let list = [...students];

 if (statusFilter === 'unpaid') {
 list = list.filter(s =>
 s.currentPeriod?.status === PERIOD_STATUS.OVERDUE ||
 s.currentPeriod?.status === PERIOD_STATUS.PENDING ||
 !s.currentPeriod,
 );
 } else if (statusFilter) {
 list = list.filter(s => s.currentPeriod?.status === statusFilter);
 }

 if (search.trim()) {
 const q = search.toLowerCase();
 list = list.filter(s =>
 `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
 (s.guardianName ?? '').toLowerCase().includes(q),
 );
 }

 const order = [PERIOD_STATUS.OVERDUE, PERIOD_STATUS.PENDING, PERIOD_STATUS.PARTIAL, PERIOD_STATUS.PAID];
 return list.sort((a, b) => {
 const ai = a.currentPeriod ? order.indexOf(a.currentPeriod.status) : order.length;
 const bi = b.currentPeriod ? order.indexOf(b.currentPeriod.status) : order.length;
 return ai - bi;
 });
 }, [students, search, statusFilter]);

 return (
 <div>
 <PageHeader
 kicker={`${MONTHS[now.getMonth()]} ${now.getFullYear()} · ${counts.unpaid} need a payment`}
 title="Your students"
 subtitle="Tap a student to record a payment."
 />

 {isLoading ? (
 <div className="grid grid-cols-4 gap-2 mb-4">
 {Array.from({ length: 4 }).map((_, i) => (
 <Skeleton key={i} className="h-[68px] rounded-[10px]" />
 ))}
 </div>
 ) : (
 <SummaryBar students={students} />
 )}

 <div className="flex flex-col gap-3 mb-4">
 <div className="relative">
 <MagnifyingGlassIcon
 size={14}
 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none"
 />
 <input
 type="search"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search by name or guardian"
 className="w-full pl-9 pr-4 py-[10px] text-[14px] bg-card border border-border rounded-[10px] placeholder:text-muted-foreground/60 text-foreground focus:outline-none focus:border-primary transition-colors"
 />
 </div>
 <div className="flex gap-1.5 flex-wrap">
 {FILTER_TABS.map((tab) => {
 const count =
 tab.value === '' ? counts.all :
 tab.value === 'unpaid' ? counts.unpaid :
 tab.value === PERIOD_STATUS.PARTIAL ? counts.partial :
 tab.value === PERIOD_STATUS.PAID ? counts.paid : 0;
 return (
 <FilterChip
 key={tab.value}
 label={tab.label}
 count={count}
 active={statusFilter === tab.value}
 urgent={tab.value === 'unpaid'}
 onClick={() => setFilter(tab.value)}
 />
 );
 })}
 </div>
 </div>

 {isLoading ? (
 <div className="flex flex-col gap-1.5">
 {Array.from({ length: 8 }).map((_, i) => (
 <Skeleton key={i} className="h-[68px] rounded-[10px]" />
 ))}
 </div>
 ) : filtered.length === 0 ? (
 <EmptyState
 title={search ? 'No students match' : 'No students assigned'}
 description={search ? 'Try a different name.' :"You don't have any active students assigned yet."}
 />
 ) : (
 <div className="flex flex-col gap-1.5">
 {filtered.map((s) => (
 <StudentCard key={s.id} student={s} />
 ))}
 </div>
 )}
 </div>
 );
}
