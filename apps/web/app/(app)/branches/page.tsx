'use client';

import { useMemo, useState } from 'react';
import { PlusIcon } from '@phosphor-icons/react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from '@/components/ui/dialog';
import { createBranchesColumns } from '@/columns/branches-columns';
import { TrashIcon, ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import { formatAddress, cn } from '@/lib/utils';
import { toTitleCase } from '@/utils/text';
import {
 useBranchesQuery,
 useCreateBranchMutation,
 useDeleteBranchMutation,
 useUpdateBranchMutation,
} from '@/hooks/useBranchesQuery';
import { COUNTRY_DEFAULT } from '@/lib/ph-geo';
import type { Branch } from '@/lib/types';

interface NewForm {
 name: string;
 streetName: string;
 barangay: string;
 city: string;
 province: string;
 phone: string;
}

const EMPTY_FORM: NewForm = { name: '', streetName: '', barangay: '', city: '', province: '', phone: '' };

const INPUT_CLS = 'px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';

export default function BranchesPage() {
 const [dialogOpen, setDialogOpen] = useState(false);
 const [form, setForm] = useState<NewForm>(EMPTY_FORM);
 const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);

 const { data: branches = [], isLoading } = useBranchesQuery();

 const closeDialog = () => setDialogOpen(false);
 const createMut = useCreateBranchMutation(() => {
 closeDialog();
 setForm(EMPTY_FORM);
 });

 const deleteMut = useDeleteBranchMutation(() => setDeleteTarget(null));
 const activateMut = useUpdateBranchMutation();

 function set(field: keyof NewForm, value: string) {
 setForm((f) => ({ ...f, [field]: value }));
 }

 function openCreate() {
 setForm(EMPTY_FORM);
 setDialogOpen(true);
 }

 function handleCreate() {
 const name = form.name.trim();
 if (!name) return;
 createMut.mutate({
 name,
 streetName: form.streetName.trim() || undefined,
 barangay: form.barangay.trim() || undefined,
 city: form.city.trim() || undefined,
 province: form.province.trim() || undefined,
 country: COUNTRY_DEFAULT,
 phone: form.phone.trim() || undefined,
 });
 }

 const columns = useMemo(
 () => createBranchesColumns({
 onDelete: setDeleteTarget, onActivate: (b) => activateMut.mutate({ id: b.id, isActive: true }),
 }),
 // eslint-disable-next-line react-hooks/exhaustive-deps
 [],
 );

 const isBusy = createMut.isPending;

 return (
 <div>
 <PageHeader
 title="Branches"
 subtitle={`${branches.length} branch${branches.length !== 1 ? 'es' : ''}`}
 action={
 <Button onClick={openCreate}>
 <PlusIcon size={14} weight="bold" />
 New Branch
 </Button>
 }
 />

 <DataTable
 columns={columns}
 data={branches}
 isLoading={isLoading}
 loadingRows={3}
 emptyTitle="No branches yet"
 emptyDescription="Create the first branch to get started."
 getRowKey={(b) => b.id}
 renderMobileCard={(b) => {
 const addr = formatAddress({
 streetName: b.streetName,
 barangay: b.barangay,
 city: b.city,
 province: b.province,
 });
 return {
 title: (
 <span className={cn(b.isActive ? '' : 'text-muted-foreground line-through')}>
 {toTitleCase(b.name)}
 </span>
 ),
 description: b.phone ?? undefined,
 badge: (
 <span
 className={cn(
 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
 b.isActive
 ? 'bg-status-paid-bg text-status-paid-fg'
 : 'bg-secondary text-muted-foreground',
 )}
 >
 {b.isActive ? 'Active' : 'Inactive'}
 </span>
 ),
 meta: <p className="truncate">{addr === '—' ? '—' : toTitleCase(addr)}</p>,
 actions: (
 <div className="flex items-center justify-end gap-2">
 {b.isActive ? (
 <button
 onClick={() => setDeleteTarget(b)}
 aria-label="Deactivate branch"
 className="p-2 rounded-md text-err bg-err-soft hover:bg-err/15 transition-all"
 >
 <TrashIcon size={18} />
 </button>
 ) : (
 <button
 onClick={() => activateMut.mutate({ id: b.id, isActive: true })}
 aria-label="Reactivate branch"
 className="p-2 rounded-md text-status-paid-fg bg-status-paid-bg hover:bg-status-paid-bg/80 transition-all"
 >
 <ArrowCounterClockwiseIcon size={18} />
 </button>
 )}
 </div>
 ),
 };
 }}
 />

 <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open && !isBusy) closeDialog(); }}>
 <DialogContent className="bg-card sm:max-w-md">
 <DialogHeader>
 <DialogTitle className="text-base">New Branch</DialogTitle>
 </DialogHeader>
 <div className="space-y-3 pt-1">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-medium text-foreground">Branch Name *</label>
 <input
 autoFocus
 type="text"
 value={form.name}
 onChange={(e) => set('name', e.target.value)}
 onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
 placeholder="e.g. Main Branch"
 className={INPUT_CLS}
 />
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-medium text-foreground">Phone</label>
 <input
 type="text"
 value={form.phone}
 onChange={(e) => set('phone', e.target.value)}
 placeholder="Optional"
 className={`${INPUT_CLS} font-mono`}
 />
 </div>
 </div>

 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-medium text-foreground">Street Name / Purok</label>
 <input
 type="text"
 value={form.streetName}
 onChange={(e) => set('streetName', e.target.value)}
 placeholder="Optional"
 className={INPUT_CLS}
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-medium text-foreground">Barangay</label>
 <input
 type="text"
 value={form.barangay}
 onChange={(e) => set('barangay', e.target.value)}
 placeholder="Optional"
 className={INPUT_CLS}
 />
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-medium text-foreground">City</label>
 <input
 type="text"
 value={form.city}
 onChange={(e) => set('city', e.target.value)}
 placeholder="Optional"
 className={INPUT_CLS}
 />
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-medium text-foreground">Province</label>
 <input
 type="text"
 value={form.province}
 onChange={(e) => set('province', e.target.value)}
 placeholder="Optional"
 className={INPUT_CLS}
 />
 </div>
 </div>

 <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground border border-border rounded-md bg-secondary">
 <span className="text-muted-foreground/60 text-xs uppercase tracking-wider">Country</span>
 <span>{COUNTRY_DEFAULT}</span>
 </div>

 <div className="flex gap-2 pt-1">
 <Button
 size="sm"
 className="flex-1"
 disabled={isBusy || !form.name.trim()}
 onClick={handleCreate}
 >
 {isBusy ? <Spinner /> : 'Save Branch'}
 </Button>
 <Button size="sm" variant="ghost" disabled={isBusy} onClick={closeDialog}>
 Cancel
 </Button>
 </div>
 </div>
 </DialogContent>
 </Dialog>

 <ConfirmDialog
 open={!!deleteTarget}
 title="Remove branch?"
 description={`Remove"${deleteTarget?.name}"? It will be hidden from the system. Branches with pending or in-progress transactions cannot be removed.`}
 confirmLabel="Remove"
 onConfirm={() => { if (deleteTarget) deleteMut.mutate(deleteTarget.id); }}
 onCancel={() => setDeleteTarget(null)}
 loading={deleteMut.isPending}
 />
 </div>
 );
}
