'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useStudentsQuery } from '@/hooks/useStudentsQuery';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import { PERIOD_STATUS, MONTHS, STUDENT_STATUS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { MagnifyingGlassIcon, CaretRightIcon } from '@phosphor-icons/react';
import type { Student } from '@/lib/types';

// ── Period status dot config ───────────────────────────────────────────────
const PERIOD_DOT: Record<string, string> = {
  [PERIOD_STATUS.PAID]:    'bg-emerald-500',
  [PERIOD_STATUS.PARTIAL]: 'bg-amber-400',
  [PERIOD_STATUS.OVERDUE]: 'bg-red-500',
  [PERIOD_STATUS.PENDING]: 'bg-zinc-300 dark:bg-zinc-600',
};

const PERIOD_RING: Record<string, string> = {
  [PERIOD_STATUS.PAID]:    'border-emerald-200 dark:border-emerald-900',
  [PERIOD_STATUS.PARTIAL]: 'border-amber-200 dark:border-amber-900',
  [PERIOD_STATUS.OVERDUE]: 'border-red-200 dark:border-red-900',
  [PERIOD_STATUS.PENDING]: 'border-zinc-200 dark:border-zinc-800',
};

const FILTER_TABS = [
  { label: 'All',     value: '' },
  { label: 'Unpaid',  value: 'unpaid' },
  { label: 'Partial', value: PERIOD_STATUS.PARTIAL },
  { label: 'Paid',    value: PERIOD_STATUS.PAID },
];

function fmt(amount: number) {
  return `₱${(amount / 100).toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;
}

// ── Student card ───────────────────────────────────────────────────────────
function StudentCard({ student }: { student: Student }) {
  const period = student.currentPeriod;
  const status = period?.status ?? 'none';
  const dotColor = PERIOD_DOT[status];
  const ringColor = PERIOD_RING[status] ?? 'border-zinc-200 dark:border-zinc-800';
  const remaining = period ? Math.max(0, period.expectedAmount - period.paidAmount) : null;
  const initials = `${student.firstName?.[0] ?? ''}${student.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <Link
      href={`/sdc/${student.id}`}
      className={cn(
        'flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-zinc-950 border rounded-xl',
        'hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors active:scale-[0.99]',
        ringColor,
      )}
    >
      {/* Avatar with status dot */}
      <div className="relative shrink-0 w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-300">{initials}</span>
        {dotColor && (
          <span
            className={cn(
              'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-950',
              dotColor,
            )}
          />
        )}
      </div>

      {/* Student info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
          {student.firstName} {student.lastName}
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
          {student.guardianName ?? '—'}
          {student.level ? <> · <span>{student.level}</span></> : null}
        </p>
      </div>

      {/* Period amount */}
      <div className="shrink-0 text-right">
        {period ? (
          <>
            {status === PERIOD_STATUS.PAID ? (
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Paid ✓</p>
            ) : remaining !== null ? (
              <p className={cn(
                'text-xs font-semibold',
                status === PERIOD_STATUS.OVERDUE ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400',
              )}>
                {fmt(remaining)} due
              </p>
            ) : null}
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              {MONTHS[(period.periodMonth ?? 1) - 1]} {period.periodYear}
            </p>
          </>
        ) : (
          <p className="text-xs text-zinc-300 dark:text-zinc-600">No period</p>
        )}
      </div>

      <CaretRightIcon size={14} className="shrink-0 text-zinc-300 dark:text-zinc-600" />
    </Link>
  );
}

// ── Summary bar ────────────────────────────────────────────────────────────
function SummaryBar({ students }: { students: Student[] }) {
  const total   = students.length;
  const paid    = students.filter(s => s.currentPeriod?.status === PERIOD_STATUS.PAID).length;
  const partial = students.filter(s => s.currentPeriod?.status === PERIOD_STATUS.PARTIAL).length;
  const overdue = students.filter(s => s.currentPeriod?.status === PERIOD_STATUS.OVERDUE || s.currentPeriod?.status === PERIOD_STATUS.PENDING).length;

  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      {[
        { label: 'Students', value: total,   color: 'text-zinc-900 dark:text-zinc-50' },
        { label: 'Paid',     value: paid,    color: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Partial',  value: partial, color: 'text-amber-500 dark:text-amber-400' },
        { label: 'Unpaid',   value: overdue, color: 'text-red-600 dark:text-red-400' },
      ].map(({ label, value, color }) => (
        <div key={label} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-2.5 text-center">
          <p className={cn('text-xl font-bold leading-none', color)}>{value}</p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function SDCPage() {
  const [search, setSearch]       = useState('');
  const [statusFilter, setFilter] = useState('');

  const { data: currentUser } = useCurrentUserQuery();
  const now = new Date();

  const { data: students = [], isLoading } = useStudentsQuery({
    status: STUDENT_STATUS.ACTIVE,
    ...(currentUser?.id ? { teacherId: currentUser.id } : {}),
  });

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

    // Sort: overdue/pending first → partial → paid → no period
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
        title="My Students"
        subtitle={`${MONTHS[now.getMonth()]} ${now.getFullYear()} · tap a student to record payment`}
        action={
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
            {[
              { dot: 'bg-emerald-500', label: 'Paid' },
              { dot: 'bg-amber-400',   label: 'Partial' },
              { dot: 'bg-red-500',     label: 'Overdue' },
              { dot: 'bg-zinc-300 dark:bg-zinc-600', label: 'Pending' },
            ].map(({ dot, label }) => (
              <span key={label} className="flex items-center gap-1">
                <span className={cn('w-2 h-2 rounded-full', dot)} />
                {label}
              </span>
            ))}
          </div>
        }
      />

      {/* Summary */}
      {isLoading
        ? <div className="grid grid-cols-4 gap-2 mb-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[58px] rounded-xl" />)}</div>
        : <SummaryBar students={students} />
      }

      {/* Search + filter */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="relative">
          <MagnifyingGlassIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search student or guardian…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl placeholder:text-zinc-400 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors',
                statusFilter === tab.value
                  ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[72px] rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={search ? 'No students match' : 'No students assigned'}
          description={search ? 'Try a different name.' : "You don't have any active students assigned yet."}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(s => <StudentCard key={s.id} student={s} />)}
        </div>
      )}
    </div>
  );
}
