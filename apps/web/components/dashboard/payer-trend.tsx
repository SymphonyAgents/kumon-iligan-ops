'use client';

import { useMemo } from 'react';
import { Kicker } from '@/components/ui/typography';
import { Skeleton } from '@/components/ui/skeleton';
import { usePaymentsQuery } from '@/hooks/usePaymentsQuery';
import { PAYMENT_STATUS, MONTHS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface MonthBucket {
  key: string;
  monthIdx: number;
  year: number;
  payerCount: number;
  amount: number;
  isCurrent: boolean;
}

function fmtPeso(v: number) {
  if (v === 0) return '₱0';
  if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `₱${Math.round(v / 1_000)}K`;
  return `₱${v.toLocaleString('en-PH')}`;
}

const MONTHS_TO_SHOW = 6;

export function PayerTrend() {
  const { data: payments = [], isLoading } = usePaymentsQuery();
  const now = new Date();

  const buckets: MonthBucket[] = useMemo(() => {
    const months: MonthBucket[] = [];
    for (let i = MONTHS_TO_SHOW - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        monthIdx: d.getMonth(),
        year: d.getFullYear(),
        payerCount: 0,
        amount: 0,
        isCurrent: i === 0,
      });
    }

    // Count UNIQUE student payers per month from verified payments.
    const seen: Record<string, Set<string>> = {};
    for (const p of payments) {
      if (p.status !== PAYMENT_STATUS.VERIFIED) continue;
      const d = new Date(p.paymentDate);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = months.find((m) => m.key === key);
      if (!bucket) continue;
      seen[key] = seen[key] ?? new Set();
      seen[key].add(p.studentId);
      bucket.amount += p.amount;
    }
    for (const m of months) {
      m.payerCount = seen[m.key]?.size ?? 0;
    }
    return months;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments]);

  const max = Math.max(1, ...buckets.map((b) => b.payerCount));
  const totalAmount = buckets.reduce((sum, b) => sum + b.amount, 0);
  const totalPayers = buckets.reduce((sum, b) => sum + b.payerCount, 0);
  const avgPayers = totalPayers / MONTHS_TO_SHOW;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <Kicker>Monthly payers</Kicker>
          <p className="text-[15px] font-semibold text-foreground tracking-[-0.1px] mt-0.5">
            Last {MONTHS_TO_SHOW} months
          </p>
          {!isLoading && (
            <p className="text-[12px] text-muted-foreground mt-0.5">
              avg {avgPayers.toFixed(1)} payers / month · {fmtPeso(totalAmount)} collected
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-end gap-2 h-32">
          {Array.from({ length: MONTHS_TO_SHOW }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1 h-full rounded-md"
              style={{ height: `${30 + i * 10}%` }}
            />
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-end gap-2 h-32 relative">
            {buckets.map((b) => {
              const heightPct = (b.payerCount / max) * 100;
              return (
                <div
                  key={b.key}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  <span
                    className={cn(
                      'absolute -top-5 text-[11px] font-medium tabular-nums transition-opacity',
                      b.payerCount > 0 ? 'opacity-100' : 'opacity-0',
                      b.isCurrent ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {b.payerCount}
                  </span>
                  <div
                    className={cn(
                      'w-full rounded-md transition-colors',
                      b.isCurrent
                        ? 'bg-primary'
                        : b.payerCount > 0
                          ? 'bg-primary/30 group-hover:bg-primary/45'
                          : 'bg-secondary',
                    )}
                    style={{
                      height: b.payerCount > 0 ? `${Math.max(heightPct, 6)}%` : '6%',
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 mt-2">
            {buckets.map((b) => (
              <div key={b.key} className="flex-1 text-center">
                <span
                  className={cn(
                    'text-[10.5px] uppercase tracking-[0.08em]',
                    b.isCurrent ? 'text-foreground font-semibold' : 'text-muted-foreground',
                  )}
                >
                  {MONTHS[b.monthIdx].slice(0, 3)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
