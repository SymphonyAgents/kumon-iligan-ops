'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useFamiliesQuery, useCreateFamilyMutation, useUpdateFamilyMutation, useDeleteFamilyMutation } from '@/hooks/useFamiliesQuery';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import { useBranchesQuery } from '@/hooks/useBranchesQuery';
import { USER_TYPE } from '@/lib/constants';
import type { Family } from '@/lib/types';
import { PlusIcon, PencilSimpleIcon, TrashIcon, UsersIcon } from '@phosphor-icons/react';

type FamilyFormData = {
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  streetName: string;
  barangay: string;
  city: string;
  notes: string;
  branchId: string;
};

const BLANK_FORM: FamilyFormData = {
  guardianName: '', guardianPhone: '', guardianEmail: '',
  streetName: '', barangay: '', city: '', notes: '', branchId: '',
};

function FamilyDialog({
  open, onClose, initial, familyId
}: {
  open: boolean; onClose: () => void; initial?: Family; familyId?: string;
}) {
  const [form, setForm] = useState<FamilyFormData>(initial ? {
    guardianName: initial.guardianName,
    guardianPhone: initial.guardianPhone,
    guardianEmail: initial.guardianEmail ?? '',
    streetName: initial.streetName ?? '',
    barangay: initial.barangay ?? '',
    city: initial.city ?? '',
    notes: initial.notes ?? '',
    branchId: initial.branchId,
  } : BLANK_FORM);

  const { data: currentUser } = useCurrentUserQuery();
  const { data: branches = [] } = useBranchesQuery();
  const isSuperadmin = currentUser?.userType === USER_TYPE.SUPERADMIN;

  const createMut = useCreateFamilyMutation(onClose);
  const updateMut = useUpdateFamilyMutation(onClose);
  const isPending = createMut.isPending || updateMut.isPending;

  function set(key: keyof FamilyFormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      guardianName: form.guardianName.trim(),
      guardianPhone: form.guardianPhone.trim(),
      guardianEmail: form.guardianEmail.trim() || undefined,
      streetName: form.streetName.trim() || undefined,
      barangay: form.barangay.trim() || undefined,
      city: form.city.trim() || undefined,
      notes: form.notes.trim() || undefined,
      branchId: form.branchId || undefined,
    };
    if (familyId) {
      updateMut.mutate({ id: familyId, data });
    } else {
      createMut.mutate(data);
    }
  }

  const field = (label: string, key: keyof FamilyFormData, type = 'text', required = false, placeholder = '') => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}{required && ' *'}</label>
      <input
        type={type}
        value={form[key]}
        onChange={set(key)}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{familyId ? 'Edit Family' : 'Add Family'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          {field('Guardian Name', 'guardianName', 'text', true, 'Full name')}
          {field('Phone Number', 'guardianPhone', 'tel', true, '+63...')}
          {field('Email', 'guardianEmail', 'email', false, 'optional')}
          <div className="grid grid-cols-2 gap-3">
            {field('Street', 'streetName', 'text', false, 'Street / purok')}
            {field('Barangay', 'barangay', 'text', false, 'Barangay')}
          </div>
          {field('City', 'city', 'text', false, 'City or municipality')}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Notes</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={2}
              placeholder="Optional notes about this family…"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-950 dark:text-zinc-50 resize-none placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          {isSuperadmin && branches.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Branch</label>
              <select
                value={form.branchId}
                onChange={set('branchId')}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Default branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : familyId ? 'Save Changes' : 'Add Family'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function FamiliesPage() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Family | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Family | null>(null);

  const { data: currentUser } = useCurrentUserQuery();
  const isAdmin = currentUser?.userType === USER_TYPE.ADMIN || currentUser?.userType === USER_TYPE.SUPERADMIN;

  const { data: families = [], isLoading } = useFamiliesQuery(
    search.length >= 2 ? { search } : undefined
  );
  const deleteMut = useDeleteFamilyMutation(() => setDeleteTarget(null));

  const filtered = useMemo(() => {
    if (!search.trim() || search.length < 2) return families;
    return families; // server-filtered
  }, [families, search]);

  return (
    <div>
      <PageHeader
        title="Families"
        subtitle="Guardian and family records"
        action={
          isAdmin ? (
            <Button onClick={() => setShowCreate(true)}>
              <PlusIcon weight="bold" size={14} />
              Add Family
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="w-full sm:max-w-xs px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No families found"
          description={search ? 'Try a different search.' : 'Add the first family to get started.'}
          action={isAdmin ? <Button onClick={() => setShowCreate(true)}><PlusIcon size={14} weight="bold" />Add Family</Button> : undefined}
        />
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">Guardian</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">Contact</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden md:table-cell">Location</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">Students</th>
                  {isAdmin && <th className="text-right px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filtered.map(f => (
                  <tr key={f.id} className="bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">{f.guardianName}</p>
                      {f.guardianEmail && <p className="text-xs text-zinc-400 dark:text-zinc-500">{f.guardianEmail}</p>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-zinc-600 dark:text-zinc-400">{f.guardianPhone}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-zinc-500 dark:text-zinc-400 text-xs">
                      {[f.barangay, f.city].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                        <UsersIcon size={13} />
                        <span className="text-xs">{f.students?.length ?? 0}</span>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditTarget(f)}
                            className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                          >
                            <PencilSimpleIcon size={14} />
                          </button>
                          {currentUser?.userType === USER_TYPE.SUPERADMIN && (
                            <button
                              onClick={() => setDeleteTarget(f)}
                              className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-red-500 transition-colors"
                            >
                              <TrashIcon size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && <FamilyDialog open onClose={() => setShowCreate(false)} />}
      {editTarget && (
        <FamilyDialog open onClose={() => setEditTarget(null)} initial={editTarget} familyId={editTarget.id} />
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Family"
        description={`Remove ${deleteTarget?.guardianName}? All associated students will also be removed. This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
