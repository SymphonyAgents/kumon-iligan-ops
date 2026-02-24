'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ReceiptIcon,
  WrenchIcon,
  CurrencyDollarIcon,
  TagIcon,
} from '@phosphor-icons/react';
import { formatPeso, PAYMENT_METHOD_LABELS } from '@/lib/utils';
import { useTransactionReportQuery } from '@/hooks/useTransactionsQuery';
import { PageHeader } from '@/components/ui/page-header';
import type { Transaction, ClaimPayment } from '@/lib/types';

const QUICK_ACTIONS = [
  { label: 'New Transaction', href: '/transactions/new', icon: ReceiptIcon },
  { label: 'New Service', href: '/services?new=1', icon: WrenchIcon },
  { label: 'New Expense', href: '/expenses?new=1', icon: CurrencyDollarIcon },
  { label: 'New Promo', href: '/promos?new=1', icon: TagIcon },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getMonthRange(year: number, month: number) {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  return { from, to };
}

export default function DashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: transactions = [] } = useTransactionReportQuery(year, month);

  const { from, to } = getMonthRange(year, month);

  const filtered = useMemo(() => {
    return (transactions as Transaction[]).filter((t) => {
      const d = t.createdAt.split('T')[0];
      return d >= from && d <= to;
    });
  }, [transactions, from, to]);

  const stats = useMemo(() => {
    const totalRevenue = filtered.reduce((sum, t) => sum + parseFloat(t.total), 0);
    const totalPaid = filtered.reduce((sum, t) => sum + parseFloat(t.paid), 0);
    const totalBalance = totalRevenue - totalPaid;

    const byStatus = filtered.reduce(
      (acc, t) => { acc[t.status] = (acc[t.status] ?? 0) + 1; return acc; },
      {} as Record<string, number>,
    );

    const byPaymentMethod = filtered.reduce(
      (acc, t) => {
        (t.payments ?? []).forEach((p: ClaimPayment) => {
          acc[p.method] = (acc[p.method] ?? 0) + parseFloat(p.amount);
        });
        return acc;
      },
      {} as Record<string, number>,
    );

    return { totalRevenue, totalPaid, totalBalance, byStatus, byPaymentMethod };
  }, [filtered]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Monthly financial summary"
        action={
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-md focus:outline-none"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-md focus:outline-none"
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        }
      />

      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {QUICK_ACTIONS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 bg-white border border-zinc-200 rounded-md px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors duration-150"
          >
            <Icon size={13} className="text-zinc-400 shrink-0" />
            {label}
          </Link>
        ))}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {[
          { label: 'Transactions', value: filtered.length, mono: false },
          { label: 'Total Revenue', value: formatPeso(stats.totalRevenue), mono: true },
          { label: 'Total Collected', value: formatPeso(stats.totalPaid), mono: true },
          { label: 'Outstanding', value: formatPeso(stats.totalBalance), mono: true },
        ].map(({ label, value, mono }) => (
          <div key={label} className="bg-white border border-zinc-200 rounded-lg p-5">
            <p className="text-xs text-zinc-400 mb-1">{label}</p>
            <p className={`text-2xl font-semibold text-zinc-950 ${mono ? 'font-mono' : ''}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-zinc-950 mb-4">Transactions by Status</h2>
          <div className="space-y-2">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between py-1">
                <span className="text-sm text-zinc-600 capitalize">{status.replace('_', ' ')}</span>
                <span className="font-mono text-sm font-medium text-zinc-950">{count}</span>
              </div>
            ))}
            {Object.keys(stats.byStatus).length === 0 && (
              <p className="text-sm text-zinc-400">No data for this period.</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-zinc-950 mb-4">Collected by Payment Method</h2>
          <div className="space-y-2">
            {Object.entries(stats.byPaymentMethod).map(([method, amount]) => (
              <div key={method} className="flex items-center justify-between py-1">
                <span className="text-sm text-zinc-600">
                  {PAYMENT_METHOD_LABELS[method] ?? method}
                </span>
                <span className="font-mono text-sm font-medium text-zinc-950">
                  {formatPeso(amount)}
                </span>
              </div>
            ))}
            {Object.keys(stats.byPaymentMethod).length === 0 && (
              <p className="text-sm text-zinc-400">No payments recorded for this period.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
