'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MagnifyingGlassIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { formatPeso, formatDate, formatDatetime, STATUS_LABELS, cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import type { Transaction } from '@/lib/types';

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const qc = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.transactions.list({ limit: 200 }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.transactions.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      !search ||
      t.number.includes(search) ||
      t.customerName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = transactions.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const handleDelete = (txn: Transaction) => {
    if (confirm(`Delete transaction #${txn.number}? This cannot be undone.`)) {
      deleteMut.mutate(txn.id);
    }
  };

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle={`${transactions.length} total`}
        action={
          <Link href="/dashboard/transactions/new">
            <Button>
              <PlusIcon size={14} weight="bold" />
              New Transaction
            </Button>
          </Link>
        }
      />

      {/* Status filter bar */}
      <div className="flex items-center gap-2 mb-5">
        {['all', 'pending', 'in_progress', 'done', 'claimed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150',
              statusFilter === s
                ? 'bg-zinc-950 text-white'
                : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100',
            )}
          >
            {s === 'all' ? 'All' : STATUS_LABELS[s]}
            {s !== 'all' && statusCounts[s] ? (
              <span className="ml-1.5 opacity-60">{statusCounts[s]}</span>
            ) : null}
          </button>
        ))}

        <div className="ml-auto relative">
          <MagnifyingGlassIcon
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Search #number or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-md text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-56 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100">
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider w-20">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Pickup
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Balance
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Created
              </th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-zinc-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState
                    title="No transactions"
                    description={
                      search || statusFilter !== 'all'
                        ? 'Try adjusting your filters.'
                        : 'Create the first transaction to get started.'
                    }
                  />
                </td>
              </tr>
            ) : (
              filtered.map((txn) => {
                const balance = parseFloat(txn.total) - parseFloat(txn.paid);
                return (
                  <tr
                    key={txn.id}
                    className="hover:bg-zinc-50 transition-colors duration-100 group"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/transactions/${txn.id}`}
                        className="font-mono text-xs text-zinc-950 hover:text-blue-600 transition-colors"
                      >
                        #{txn.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/transactions/${txn.id}`}
                        className="block hover:text-blue-600 transition-colors"
                      >
                        <span className="font-medium text-zinc-950">
                          {txn.customerName ?? '—'}
                        </span>
                        {txn.customerPhone && (
                          <span className="block text-xs text-zinc-400">{txn.customerPhone}</span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={txn.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500">
                      {formatDate(txn.pickupDate)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-zinc-950">
                      {formatPeso(txn.total)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      <span className={balance > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                        {balance > 0 ? formatPeso(balance) : 'Paid'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400">
                      {formatDatetime(txn.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(txn)}
                        disabled={deleteMut.isPending}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-500 transition-all duration-150 rounded"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
