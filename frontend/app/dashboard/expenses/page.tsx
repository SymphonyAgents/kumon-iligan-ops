'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { formatPeso, today } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import type { Expense } from '@/lib/types';

export default function ExpensesPage() {
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(today());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: '', note: '', amount: '' });

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', selectedDate],
    queryFn: () => api.expenses.listByDate(selectedDate),
  });

  const { data: summary } = useQuery({
    queryKey: ['expenses-summary', selectedDate],
    queryFn: () => api.expenses.summary(selectedDate),
  });

  const createMut = useMutation({
    mutationFn: () =>
      api.expenses.create({
        dateKey: selectedDate,
        category: form.category || undefined,
        note: form.note || undefined,
        amount: form.amount,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', selectedDate] });
      qc.invalidateQueries({ queryKey: ['expenses-summary', selectedDate] });
      setShowForm(false);
      setForm({ category: '', note: '', amount: '' });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.expenses.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', selectedDate] });
      qc.invalidateQueries({ queryKey: ['expenses-summary', selectedDate] });
    },
  });

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
        <div className="bg-white border border-zinc-200 rounded-lg p-5 mb-6">
          <h3 className="text-sm font-semibold text-zinc-950 mb-4">New Expense</h3>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Category"
              placeholder="e.g. Supplies, Utilities"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
            <Input
              label="Note"
              placeholder="Brief description"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
            <Input
              label="Amount (₱)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="font-mono"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button disabled={createMut.isPending || !form.amount} onClick={() => createMut.mutate()}>
              {createMut.isPending ? 'Saving...' : 'Save Expense'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowForm(false);
                setForm({ category: '', note: '', amount: '' });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
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
