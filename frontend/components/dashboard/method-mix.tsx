'use client';

import { useMemo } from 'react';
import { Kicker } from '@/components/ui/typography';
import { Skeleton } from '@/components/ui/skeleton';
import { usePaymentsQuery } from '@/hooks/usePaymentsQuery';
import { PAYMENT_STATUS, PAYMENT_METHOD, PAYMENT_METHOD_LABELS, MONTHS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface MethodSlice {
  key: string;
  label: string;
  count: number;
  amount: number;
  // CSS color via the design-token --color-* vars; written as `var(...)` so the
  // SVG can use it without Tailwind parsing arbitrary class colors.
  color: string;
}

const METHOD_ORDER: { key: string; color: string }[] = [
  { key: PAYMENT_METHOD.GCASH,         color: 'var(--color-primary)' },           // forest green
  { key: PAYMENT_METHOD.BANK_TRANSFER, color: 'var(--color-warn)' },              // amber
  { key: PAYMENT_METHOD.CASH,          color: 'var(--color-foreground)' },        // near-black
  { key: PAYMENT_METHOD.OTHER,         color: 'var(--color-muted-foreground)' },  // grey
];

function fmtPeso(v: number) {
  return `₱${(v / 100).toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;
}

interface DonutProps {
  slices: MethodSlice[];
  total: number;
  size?: number;
}

function Donut({ slices, total, size = 132 }: DonutProps) {
  const radius = size / 2;
  const stroke = size * 0.18;
  const inner = radius - stroke;
  const circumference = 2 * Math.PI * (radius - stroke / 2);

  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={radius}
          cy={radius}
          r={radius - stroke / 2}
          fill="none"
          stroke="var(--color-secondary)"
          strokeWidth={stroke}
        />
      </svg>
    );
  }

  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s) => {
        const frac = s.count / total;
        const dash = frac * circumference;
        const offset = -acc * circumference;
        acc += frac;
        return (
          <circle
            key={s.key}
            cx={radius}
            cy={radius}
            r={radius - stroke / 2}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${radius} ${radius})`}
            style={{ transition: 'stroke-dasharray 200ms ease-out' }}
          />
        );
      })}
      <text
        x={radius}
        y={radius}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--color-foreground)"
        style={{
          fontSize: inner > 32 ? 22 : 16,
          fontWeight: 600,
          letterSpacing: '-0.4px',
        }}
      >
        {total}
      </text>
      <text
        x={radius}
        y={radius + 18}
        textAnchor="middle"
        fill="var(--color-muted-foreground)"
        style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}
      >
        verified
      </text>
    </svg>
  );
}

export function MethodMix() {
  const { data: payments = [], isLoading } = usePaymentsQuery();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { slices, total, totalAmount } = useMemo(() => {
    const verified = payments.filter((p) => {
      if (p.status !== PAYMENT_STATUS.VERIFIED) return false;
      const d = new Date(p.paymentDate);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });
    const counts: Record<string, { count: number; amount: number }> = {};
    for (const p of verified) {
      const k = p.paymentMethod;
      counts[k] = counts[k] ?? { count: 0, amount: 0 };
      counts[k].count += 1;
      counts[k].amount += p.amount;
    }
    const slicesArr: MethodSlice[] = METHOD_ORDER.map(({ key, color }) => ({
      key,
      label: PAYMENT_METHOD_LABELS[key] ?? key,
      count: counts[key]?.count ?? 0,
      amount: counts[key]?.amount ?? 0,
      color,
    })).filter((s) => s.count > 0);
    const total = slicesArr.reduce((sum, s) => sum + s.count, 0);
    const totalAmount = slicesArr.reduce((sum, s) => sum + s.amount, 0);
    return { slices: slicesArr, total, totalAmount };
  }, [payments, month, year]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <Kicker>Payment methods</Kicker>
          <p className="text-[15px] font-semibold text-foreground tracking-[-0.1px] mt-0.5">
            How money came in
          </p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {MONTHS[month - 1]} {year}
          </p>
        </div>
        {!isLoading && total > 0 && (
          <div className="text-right shrink-0">
            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground/80">Total</p>
            <p className="text-[15px] font-semibold text-foreground tracking-[-0.1px]">
              {fmtPeso(totalAmount)}
            </p>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-5">
          <Skeleton className="w-[132px] h-[132px] rounded-full shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      ) : total === 0 ? (
        <div className="flex items-center gap-5">
          <Donut slices={[]} total={0} />
          <p className="text-[13px] text-muted-foreground flex-1">
            No verified payments yet for {MONTHS[month - 1]}. The mix will appear here as
            payments are verified.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-5">
          <Donut slices={slices} total={total} />
          <ul className="flex-1 flex flex-col gap-2 min-w-0">
            {slices.map((s) => {
              const pct = Math.round((s.count / total) * 100);
              return (
                <li key={s.key} className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-[13px] text-foreground truncate flex-1">
                    {s.label}
                  </span>
                  <span className="text-[12.5px] font-medium text-muted-foreground tabular-nums">
                    {pct}%
                  </span>
                  <span className="text-[12.5px] font-mono text-foreground tabular-nums">
                    {s.count}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
