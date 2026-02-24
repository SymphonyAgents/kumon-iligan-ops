'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PromoForm } from '@/components/forms/promo-form';
import { usePromosQuery, useDeletePromoMutation } from '@/hooks/usePromosQuery';
import type { Promo } from '@/lib/types';

const isPromoActive = (p: Promo) => {
  if (!p.isActive) return false;
  const today = new Date().toISOString().split('T')[0];
  if (p.dateFrom && p.dateFrom > today) return false;
  if (p.dateTo && p.dateTo < today) return false;
  return true;
};

export default function PromosPage() {
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (searchParams.get('new') === '1') setShowForm(true);
  }, [searchParams]);

  const { data: promos = [], isLoading } = usePromosQuery();
  const deleteMut = useDeletePromoMutation();

  return (
    <div>
      <PageHeader
        title="Promos"
        subtitle="Promotional codes and discounts"
        action={
          <Button onClick={() => setShowForm((v) => !v)}>
            <PlusIcon size={14} weight="bold" />
            Add Promo
          </Button>
        }
      />

      {showForm && (
        <PromoForm
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Discount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Valid Period
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Status
              </th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-zinc-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (promos as Promo[]).length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState title="No promos yet" description="Create your first promo code." />
                </td>
              </tr>
            ) : (
              (promos as Promo[]).map((p) => {
                const active = isPromoActive(p);
                return (
                  <tr key={p.id} className="hover:bg-zinc-50 group transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-950">{p.name}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm bg-zinc-100 px-2 py-0.5 rounded text-zinc-700">
                        {p.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-700">{parseFloat(p.percent).toFixed(0)}%</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {p.dateFrom || p.dateTo
                        ? `${formatDate(p.dateFrom)} — ${formatDate(p.dateTo)}`
                        : 'No expiry'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          active
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-zinc-100 text-zinc-400'
                        }`}
                      >
                        {active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          if (confirm(`Deactivate promo "${p.code}"?`)) deleteMut.mutate(p.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-500 rounded transition-all"
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
