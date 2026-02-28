'use client';

import { useMemo, useState } from 'react';
import { PlusIcon } from '@phosphor-icons/react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { createBranchesColumns } from '@/columns/branches-columns';
import {
  useBranchesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
} from '@/hooks/useBranchesQuery';
import type { Branch } from '@/lib/types';

interface EditForm {
  name: string;
  address: string;
  phone: string;
}

const EMPTY_FORM: EditForm = { name: '', address: '', phone: '' };

export default function BranchesPage() {
  const [showForm, setShowForm] = useState(false);
  const [newForm, setNewForm] = useState<EditForm>(EMPTY_FORM);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_FORM);

  const { data: branches = [], isLoading } = useBranchesQuery(false);

  const createMut = useCreateBranchMutation(() => {
    setShowForm(false);
    setNewForm(EMPTY_FORM);
  });

  const updateMut = useUpdateBranchMutation(() => {
    setEditId(null);
    setEditForm(EMPTY_FORM);
  });

  function startEdit(b: Branch) {
    setEditId(b.id);
    setEditForm({ name: b.name, address: b.address ?? '', phone: b.phone ?? '' });
    setShowForm(false);
  }

  function cancelEdit() {
    setEditId(null);
    setEditForm(EMPTY_FORM);
  }

  function handleCreate() {
    const name = newForm.name.trim();
    if (!name) return;
    createMut.mutate({ name, address: newForm.address.trim() || undefined, phone: newForm.phone.trim() || undefined });
  }

  const columns = useMemo(
    () => createBranchesColumns({
      editId,
      form: editForm,
      setForm: setEditForm,
      onUpdate: () => {
        if (!editId || !editForm.name.trim()) return;
        updateMut.mutate({
          id: editId,
          name: editForm.name.trim(),
          address: editForm.address.trim() || null,
          phone: editForm.phone.trim() || null,
        });
      },
      onCancelEdit: cancelEdit,
      onStartEdit: startEdit,
      onToggle: (id, isActive) => updateMut.mutate({ id, isActive }),
      isSaving: updateMut.isPending,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editId, editForm, updateMut.isPending],
  );

  return (
    <div>
      <PageHeader
        title="Branches"
        subtitle={`${branches.length} branch${branches.length !== 1 ? 'es' : ''}`}
        action={
          !showForm ? (
            <Button onClick={() => { setShowForm(true); cancelEdit(); }}>
              <PlusIcon size={14} weight="bold" />
              New Branch
            </Button>
          ) : null
        }
      />

      {showForm && (
        <div className="bg-white border border-zinc-200 rounded-lg p-4 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            autoFocus
            type="text"
            value={newForm.name}
            onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setShowForm(false); setNewForm(EMPTY_FORM); } }}
            placeholder="Branch name *"
            className="px-3 py-2 text-sm bg-white border border-zinc-200 rounded-md text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <input
            type="text"
            value={newForm.address}
            onChange={(e) => setNewForm((f) => ({ ...f, address: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setShowForm(false); setNewForm(EMPTY_FORM); } }}
            placeholder="Address (optional)"
            className="px-3 py-2 text-sm bg-white border border-zinc-200 rounded-md text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <input
            type="text"
            value={newForm.phone}
            onChange={(e) => setNewForm((f) => ({ ...f, phone: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setShowForm(false); setNewForm(EMPTY_FORM); } }}
            placeholder="Phone (optional)"
            className="px-3 py-2 text-sm bg-white border border-zinc-200 rounded-md font-mono text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <div className="sm:col-span-3 flex items-center gap-2">
            <Button
              size="sm"
              variant="dark"
              disabled={!newForm.name.trim() || createMut.isPending}
              onClick={handleCreate}
            >
              {createMut.isPending ? 'Saving...' : 'Save Branch'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowForm(false); setNewForm(EMPTY_FORM); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-zinc-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : branches.length === 0 ? (
        <EmptyState title="No branches yet" description="Create the first branch to get started." />
      ) : (
        <DataTable columns={columns} data={branches} />
      )}
    </div>
  );
}
