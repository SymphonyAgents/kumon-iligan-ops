'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { formatPeso, today } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ExpenseForm } from '@/components/forms/expense-form';
import {
  useExpensesQuery,
  useExpensesSummaryQuery,
  useDeleteExpenseMutation,
} from '@/hooks/useExpensesQuery';
import type { Expense } from '@/lib/types';

export default function ExpensesPage() {
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(today());
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (searchParams.get('new') === '1') setShowForm(true);
  }, [searchParams]);

  const { data: expenses = [], isLoading } = useExpensesQuery(selectedDate);
  const { data: summary } = useExpensesSummaryQuery(selectedDate);
  const deleteMut = useDeleteExpenseMutation(selectedDate);

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle="Daily operational expenses"
        action={
          <Button onClick={() => setShowForm((v) => !v)}>
            <PlusIcon size={14} weight="bold" />
            Add Expense
          </Button>
        }
      />

      <div className="flex items-center gap-4 mb-6">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 text-sm bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
        {summary && (
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-zinc-400">Daily total:</span>
            <span className="font-mono font-semibold text-zinc-950">
              {formatPeso(summary.total)}
            </span>
          </div>
        )}
      </div>

      {showForm && (
        <ExpenseForm
          dateKey={selectedDate}
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Note
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-zinc-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (expenses as Expense[]).length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <EmptyState
                    title="No expenses"
                    description="No expenses recorded for this date."
                  />
                </td>
              </tr>
            ) : (
              (expenses as Expense[]).map((e) => (
                <tr key={e.id} className="hover:bg-zinc-50 group transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-950">{e.category ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-500">{e.note ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-950">
                    {formatPeso(e.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        if (confirm('Delete this expense?')) deleteMut.mutate(e.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-500 rounded transition-all"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
