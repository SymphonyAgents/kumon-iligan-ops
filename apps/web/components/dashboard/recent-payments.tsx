'use client';

import Link from 'next/link';
import { Kicker } from '@/components/ui/typography';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePaymentsQuery } from '@/hooks/usePaymentsQuery';
import { fullName, toTitleCase } from '@/utils/text';
import { ArrowRightIcon } from '@phosphor-icons/react';
import type { Payment } from '@/lib/types';

function fmtPeso(amount: number) {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.max(1, Math.floor((now - then) / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  const wk = Math.floor(day / 7);
  if (wk < 4) return `${wk}w`;
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function studentInitials(p: Payment): string {
  const f = p.studentFirstName?.[0] ?? '';
  const l = p.studentLastName?.[0] ?? '';
  return (f + l).toUpperCase() || '·';
}

export function RecentPayments() {
  const { data: payments = [], isLoading } = usePaymentsQuery();

  const recent = [...payments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <Kicker>Recent payments</Kicker>
          <p className="text-[15px] font-semibold text-foreground tracking-[-0.1px] mt-0.5">
            Latest activity
          </p>
        </div>
        <Link
          href="/payments"
          className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary hover:underline"
        >
          View all
          <ArrowRightIcon size={11} />
        </Link>
      </div>

      {isLoading ? (
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-3 flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-4 w-40 flex-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-[13px] text-muted-foreground">No payments yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {recent.map((p) => (
            <Link
              key={p.id}
              href={`/payments?focus=${p.id}`}
              className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/40 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-accent-soft text-accent-foreground flex items-center justify-center text-[11px] font-semibold shrink-0">
                {studentInitials(p)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-medium text-foreground tracking-[-0.05px] truncate">
                  {fullName(p.studentFirstName, p.studentLastName) || '—'}
                </p>
                <p className="text-[11.5px] text-muted-foreground truncate">
                  {p.guardianName ? toTitleCase(p.guardianName) : '—'}
                  {p.referenceNumber ? <> · <span className="font-mono">{p.referenceNumber}</span></> : null}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[14px] font-semibold tracking-[-0.1px] text-foreground">
                  {fmtPeso(p.amount)}
                </p>
                <div className="flex items-center justify-end gap-2 mt-0.5">
                  <StatusBadge status={p.status} variant="dot" />
                  <span className="text-[11px] text-muted-foreground/80">{timeAgo(p.createdAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
