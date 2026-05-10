'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiCombobox } from '@/components/ui/multi-combobox';
import {
  useFamiliesQuery,
  useCreateFamilyMutation,
  useUpdateFamilyMutation,
  useDeleteFamilyMutation,
} from '@/hooks/useFamiliesQuery';
import { useStudentsQuery, useUpdateStudentMutation } from '@/hooks/useStudentsQuery';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import { useBranchesQuery } from '@/hooks/useBranchesQuery';
import { USER_TYPE } from '@/lib/constants';
import { api } from '@/lib/api';
import { toTitleCase } from '@/utils/text';
import { toast } from 'sonner';
import type { Family } from '@/lib/types';
import { PlusIcon, PencilSimpleIcon, TrashIcon, UsersIcon } from '@phosphor-icons/react';

type FamilyFormData = {
  guardianName: string;
  guardianPhone: string;
  address: string;
  notes: string;
  branchId: string;
};

const BLANK_FORM: FamilyFormData = {
  guardianName: '',
  guardianPhone: '',
  address: '',
  notes: '',
  branchId: '',
};

function FamilyDialog({
  open,
  onClose,
  initial,
  familyId,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Family;
  familyId?: string;
}) {
  const [form, setForm] = useState<FamilyFormData>(
    initial
      ? {
          guardianName: initial.guardianName,
          guardianPhone: initial.guardianPhone,
          // Backwards-compat: stitch streetName/barangay/city into a single address line
          // when editing legacy rows. New saves write the whole thing back to streetName.
          address: [initial.streetName, initial.barangay, initial.city].filter(Boolean).join(', '),
          notes: initial.notes ?? '',
          branchId: initial.branchId,
        }
      : BLANK_FORM,
  );

  const initialChildIds = useMemo(
    () => (initial?.students?.map((s) => s.id) ?? []),
    [initial],
  );
  const [childIds, setChildIds] = useState<string[]>(initialChildIds);

  const { data: currentUser } = useCurrentUserQuery();
  const { data: branches = [] } = useBranchesQuery();
  // Pull all active students; show those that are unassigned OR already in this family.
  const { data: allStudents = [] } = useStudentsQuery({ status: 'active' });
  const studentOptions = useMemo(
    () =>
      allStudents
        .filter((s) => !s.familyId || s.familyId === familyId)
        .map((s) => ({
          value: s.id,
          label: toTitleCase(`${s.firstName} ${s.lastName}`),
          description: s.level ?? undefined,
          keywords: `${s.firstName} ${s.lastName}`,
        })),
    [allStudents, familyId],
  );

  const isSuperadmin = currentUser?.userType === USER_TYPE.SUPERADMIN;

  const createMut = useCreateFamilyMutation();
  const updateMut = useUpdateFamilyMutation();
  const updateStudentMut = useUpdateStudentMutation();
  const isPending = createMut.isPending || updateMut.isPending || updateStudentMut.isPending;

  function set<K extends keyof FamilyFormData>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function reassignChildren(targetFamilyId: string) {
    const before = new Set(initialChildIds);
    const after = new Set(childIds);
    const toAttach = childIds.filter((id) => !before.has(id));
    const toDetach = initialChildIds.filter((id) => !after.has(id));

    // Detached children currently land on their existing family (none / unchanged).
    // We only support attaching here — the API requires familyId to be a real UUID.
    const ops: Promise<unknown>[] = [];
    for (const sid of toAttach) {
      ops.push(api.students.update(sid, { familyId: targetFamilyId }));
    }
    if (toDetach.length > 0) {
      // No "detach" semantics in current schema (familyId is required). Surface a notice.
      toast.warning(
        `${toDetach.length} student${toDetach.length > 1 ? 's' : ''} can't be detached — assign them to a different family instead.`,
      );
    }
    if (ops.length > 0) await Promise.allSettled(ops);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      guardianName: form.guardianName.trim(),
      guardianPhone: form.guardianPhone.trim(),
      streetName: form.address.trim() || undefined,
      // Clear legacy fields so old data doesn't linger.
      barangay: undefined,
      city: undefined,
      notes: form.notes.trim() || undefined,
      branchId: form.branchId || undefined,
    };

    try {
      let resolvedId = familyId;
      if (familyId) {
        await updateMut.mutateAsync({ id: familyId, data });
      } else {
        const created = await createMut.mutateAsync(data);
        resolvedId = created.id;
      }
      if (resolvedId && childIds.length + initialChildIds.length > 0) {
        await reassignChildren(resolvedId);
      }
      onClose();
    } catch {
      // Toasts surfaced by the mutations themselves.
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{familyId ? 'Edit Family' : 'Add Family'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Guardian Name *</label>
            <input
              type="text"
              value={form.guardianName}
              onChange={set('guardianName')}
              required
              placeholder="Full name"
              className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Phone Number *</label>
            <input
              type="tel"
              value={form.guardianPhone}
              onChange={set('guardianPhone')}
              required
              placeholder="+63..."
              className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={set('address')}
              placeholder="Street, barangay, city"
              className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Children</label>
            <MultiCombobox
              options={studentOptions}
              value={childIds}
              onChange={setChildIds}
              placeholder="Assign children…"
              searchPlaceholder="Search students"
              emptyMessage="No unassigned students."
            />
            <p className="text-[11px] text-muted-foreground">
              Only active, unassigned students appear here. To move a child between families, edit
              them from the Students page.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Notes</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={2}
              placeholder="Optional notes about this family…"
              className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {isSuperadmin && branches.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">Branch</label>
              <Select
                value={form.branchId || '__default__'}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, branchId: v === '__default__' ? '' : v }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Default branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__default__">Default branch</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
  const isAdmin =
    currentUser?.userType === USER_TYPE.ADMIN || currentUser?.userType === USER_TYPE.SUPERADMIN;

  const { data: families = [], isLoading } = useFamiliesQuery(
    search.length >= 2 ? { search } : undefined,
  );
  const deleteMut = useDeleteFamilyMutation(() => setDeleteTarget(null));

  const filtered = families;

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
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="w-full sm:max-w-xs px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No families found"
          description={search ? 'Try a different search.' : 'Add the first family to get started.'}
          action={
            isAdmin ? (
              <Button onClick={() => setShowCreate(true)}>
                <PlusIcon size={14} weight="bold" />
                Add Family
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="text-left px-4 py-2.5 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">Guardian</th>
                  <th className="text-left px-4 py-2.5 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.12em] hidden sm:table-cell">Contact</th>
                  <th className="text-left px-4 py-2.5 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.12em] hidden md:table-cell">Address</th>
                  <th className="text-left px-4 py-2.5 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">Students</th>
                  {isAdmin && (
                    <th className="text-right px-4 py-2.5 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{toTitleCase(f.guardianName)}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-foreground font-mono text-xs">{f.guardianPhone}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                      {toTitleCase([f.streetName, f.barangay, f.city].filter(Boolean).join(', ')) || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <UsersIcon size={13} />
                        <span className="text-xs">{f.students?.length ?? 0}</span>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditTarget(f)}
                            className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                          >
                            <PencilSimpleIcon size={14} />
                          </button>
                          {currentUser?.userType === USER_TYPE.SUPERADMIN && (
                            <button
                              onClick={() => setDeleteTarget(f)}
                              className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-err transition-colors"
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
        <FamilyDialog
          open
          onClose={() => setEditTarget(null)}
          initial={editTarget}
          familyId={editTarget.id}
        />
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Family"
        description={`Remove ${toTitleCase(deleteTarget?.guardianName ?? '')}? All associated students will also be removed. This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
