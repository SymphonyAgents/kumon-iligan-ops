'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlusIcon } from '@phosphor-icons/react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Spinner } from '@/components/ui/spinner';
import { PromoForm } from '@/components/forms/promo-form';
import { createPromoColumns, type PromoEditForm } from '@/columns/promos-columns';
import { usePromosQuery, useUpdatePromoMutation, useDeletePromoMutation } from '@/hooks/usePromosQuery';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Promo } from '@/lib/types';

const EMPTY_EDIT: PromoEditForm = { name: '', code: '', percent: '', dateFrom: '', dateTo: '' };

export default function PromosPage() {
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Promo | null>(null);
  const [editTarget, setEditTarget] = useState<Promo | null>(null);
  const [editForm, setEditForm] = useState<PromoEditForm>(EMPTY_EDIT);

  useEffect(() => {
    if (searchParams.get('new') === '1') setShowForm(true);
  }, [searchParams]);

  const { data: promos = [], isLoading } = usePromosQuery();
  const updateMut = useUpdatePromoMutation(() => setEditTarget(null));
  const deleteMut = useDeletePromoMutation();

  const startEdit = (p: Promo) => {
    setEditTarget(p);
    setEditForm({
      name: p.name,
      code: p.code,
      percent: p.percent,
      dateFrom: p.dateFrom ?? '',
      dateTo: p.dateTo ?? '',
    });
    setShowForm(false);
  };

  const columns = useMemo(
    () => createPromoColumns({
      onDelete: setDeleteTarget,
      onToggle: (id, isActive) => updateMut.mutate({ id, isActive }),
      onStartEdit: startEdit,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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

      <DataTable
        columns={columns}
        data={promos as Promo[]}
        isLoading={isLoading}
        loadingRows={3}
        emptyTitle="No promos yet"
        emptyDescription="Create your first promo code."
      />

      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent className="bg-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Edit Promo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-700">Promo Name</label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-700">Code</label>
              <input
                value={editForm.code}
                onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 text-sm font-mono uppercase border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-700">Discount %</label>
              <input
                type="number"
                min="1"
                max="100"
                step="0.5"
                value={editForm.percent}
                onChange={(e) => setEditForm((f) => ({ ...f, percent: e.target.value }))}
                className="w-full px-3 py-2 text-sm font-mono border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-700">Valid From</label>
                <input
                  type="date"
                  value={editForm.dateFrom}
                  onChange={(e) => setEditForm((f) => ({ ...f, dateFrom: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-700">Valid Until</label>
                <input
                  type="date"
                  value={editForm.dateTo}
                  onChange={(e) => setEditForm((f) => ({ ...f, dateTo: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                className="flex-1"
                disabled={updateMut.isPending || !editForm.name.trim() || !editForm.code.trim()}
                onClick={() => {
                  if (!editTarget) return;
                  updateMut.mutate({
                    id: editTarget.id,
                    name: editForm.name,
                    code: editForm.code,
                    percent: editForm.percent,
                    dateFrom: editForm.dateFrom || undefined,
                    dateTo: editForm.dateTo || undefined,
                  });
                }}
              >
                {updateMut.isPending ? <Spinner /> : 'Save'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditTarget(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove promo?"
        description={`Remove promo "${deleteTarget?.code}"? This cannot be undone.`}
        confirmLabel="Remove"
        onConfirm={() => { if (deleteTarget) deleteMut.mutate(deleteTarget.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
