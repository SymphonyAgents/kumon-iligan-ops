'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataCardList } from '@/components/ui/data-card-list';
import { useUrlParam } from '@/hooks/useUrlParam';
import { toTitleCase } from '@/utils/text';
import { useUsersQuery, useApproveUserMutation, useRejectUserMutation, useUpdateUserRoleMutation, useUpdateUserBranchMutation, useDeleteUserMutation } from '@/hooks/useUsersQuery';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import { useBranchesQuery } from '@/hooks/useBranchesQuery';
import { USER_TYPE, USER_TYPE_LABELS, USER_STATUS } from '@/lib/constants';
import { RequireAdmin } from '@/components/auth/RequireAdmin';
import type { AppUser } from '@/lib/types';
import { CheckIcon, XIcon, TrashIcon } from '@phosphor-icons/react';

type Tab = 'active' | 'pending';

export default function UsersPage() {
 return (
 <RequireAdmin>
 <UsersContent />
 </RequireAdmin>
 );
}

function UsersContent() {
 const [tabRaw, setTabRaw] = useUrlParam('tab', { defaultValue: 'active' });
 const tab = tabRaw as Tab;
 const setTab = (v: Tab) => setTabRaw(v);
 const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
 const [approveTarget, setApproveTarget] = useState<AppUser | null>(null);
 const [rejectTarget, setRejectTarget] = useState<AppUser | null>(null);

 const { data: currentUser } = useCurrentUserQuery();
 const isSuperadmin = currentUser?.userType === USER_TYPE.SUPERADMIN;

 const { data: users = [], isLoading } = useUsersQuery();
 const { data: branches = [] } = useBranchesQuery();

 const approveMut = useApproveUserMutation(() => setApproveTarget(null));
 const rejectMut = useRejectUserMutation(() => setRejectTarget(null));
 const deleteMut = useDeleteUserMutation(() => setDeleteTarget(null));
 const roleMut = useUpdateUserRoleMutation();
 const branchMut = useUpdateUserBranchMutation();

 const filteredUsers = useMemo(() => {
 if (tab === 'pending') return users.filter(u => u.status === USER_STATUS.PENDING);
 return users.filter(u => u.status === USER_STATUS.ACTIVE);
 }, [users, tab]);

 const pendingCount = users.filter(u => u.status === USER_STATUS.PENDING).length;

  function getBranchName(branchId: string | null) {
    if (!branchId) return '—';
    return toTitleCase(branches.find((b) => b.id === branchId)?.name ?? '') || '—';
  }

 return (
 <div>
 <PageHeader title="Users" subtitle="Manage teachers and admin accounts" />

 <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit mb-4">
 {(['active', 'pending'] as Tab[]).map(t => (
 <button
 key={t}
 onClick={() => setTab(t)}
 className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize flex items-center gap-1.5 ${
 tab === t
 ? 'bg-card text-foreground shadow-sm'
 : 'text-muted-foreground hover:text-foreground dark:hover:text-foreground'
 }`}
 >
 {t === 'active' ? 'Active' : 'Pending'}
 {t === 'pending' && pendingCount > 0 && (
 <span className="bg-amber-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
 {pendingCount}
 </span>
 )}
 </button>
 ))}
 </div>

 {isLoading ? (
 <TableSkeleton />
 ) : filteredUsers.length === 0 ? (
 <EmptyState
 title={tab === 'pending' ? 'No pending users' : 'No active users'}
 description={tab === 'pending' ? 'New users will appear here awaiting approval.' : undefined}
 />
 ) : (
 <>
 <DataCardList
 items={filteredUsers}
 getKey={(u) => u.id}
 renderCard={(u) => ({
 title: toTitleCase(u.fullName ?? u.nickname ?? '') || '—',
 description: u.email,
 badge: <StatusBadge status={u.status} />,
 meta: (
 <>
 <p>Role: {USER_TYPE_LABELS[u.userType]}</p>
 <p className="truncate">Branch: {getBranchName(u.branchId)}</p>
 </>
 ),
 actions: isSuperadmin ? (
 <div className="flex items-center justify-end gap-2">
 {u.status === USER_STATUS.PENDING && (
 <>
 <button
 onClick={() => setApproveTarget(u)}
 aria-label="Approve user"
 className="p-2 rounded-md text-status-paid-fg hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
 >
 <CheckIcon size={18} weight="bold" />
 </button>
 <button
 onClick={() => setRejectTarget(u)}
 aria-label="Reject user"
 className="p-2 rounded-md text-err hover:bg-err-soft dark:hover:bg-red-950 transition-colors"
 >
 <XIcon size={18} weight="bold" />
 </button>
 </>
 )}
 {u.id !== currentUser?.id && (
 <button
 onClick={() => setDeleteTarget(u)}
 aria-label="Delete user"
 className="p-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-err transition-colors"
 >
 <TrashIcon size={18} />
 </button>
 )}
 </div>
 ) : undefined,
 })}
 />
 <div className="hidden sm:block rounded-xl border border-border overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-border bg-secondary/40">
 <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">User</th>
 <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Role</th>
 <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Branch</th>
 <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
 {isSuperadmin && <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Actions</th>}
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
 {filteredUsers.map(u => (
 <tr key={u.id}  className="bg-card hover:bg-secondary/40 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{toTitleCase(u.fullName ?? u.nickname ?? '') || '—'}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
 <td className="px-4 py-3">
 {isSuperadmin && u.id !== currentUser?.id ? (
                  <Select
                    value={u.userType}
                    onValueChange={(v) => roleMut.mutate({ id: u.id, userType: v })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(USER_TYPE_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
 ) : (
 <span className="text-xs text-foreground">{USER_TYPE_LABELS[u.userType]}</span>
 )}
 </td>
 <td className="px-4 py-3 hidden md:table-cell">
 {isSuperadmin && branches.length > 1 && u.id !== currentUser?.id ? (
                  <Select
                    value={u.branchId ?? '__none__'}
                    onValueChange={(v) => branchMut.mutate({ id: u.id, branchId: v === '__none__' ? '' : v })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="No branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No branch</SelectItem>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
 ) : (
 <span className="text-xs text-muted-foreground">{getBranchName(u.branchId)}</span>
 )}
 </td>
 <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
 {isSuperadmin && (
 <td className="px-4 py-3">
 <div className="flex items-center justify-end gap-1">
 {u.status === USER_STATUS.PENDING && (
 <>
 <button
 onClick={() => setApproveTarget(u)}
 title="Approve"
 className="p-1.5 rounded-md text-status-paid-fg hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
 >
 <CheckIcon size={14} weight="bold" />
 </button>
 <button
 onClick={() => setRejectTarget(u)}
 title="Reject"
 className="p-1.5 rounded-md text-err hover:bg-err-soft dark:hover:bg-red-950 transition-colors"
 >
 <XIcon size={14} weight="bold" />
 </button>
 </>
 )}
 {u.id !== currentUser?.id && (
 <button
 onClick={() => setDeleteTarget(u)}
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
 </>
 )}

 <ConfirmDialog
 open={!!approveTarget}
 title="Approve User"
 description={`Approve ${toTitleCase(approveTarget?.fullName ?? '') || approveTarget?.email} as ${USER_TYPE_LABELS[approveTarget?.userType ?? 'teacher']}?`}
 confirmLabel="Approve"
 onConfirm={() => approveTarget && approveMut.mutate(approveTarget.id)}
 onCancel={() => setApproveTarget(null)}
 loading={approveMut.isPending}
 />
 <ConfirmDialog
 open={!!rejectTarget}
 title="Reject User"
 description={`Reject and remove ${toTitleCase(rejectTarget?.fullName ?? '') || rejectTarget?.email}? They will not be able to access the system.`}
 confirmLabel="Reject"
 confirmVariant="danger"
 onConfirm={() => rejectTarget && rejectMut.mutate(rejectTarget.id)}
 onCancel={() => setRejectTarget(null)}
 loading={rejectMut.isPending}
 />
 <ConfirmDialog
 open={!!deleteTarget}
 title="Delete User"
 description={`Permanently remove ${toTitleCase(deleteTarget?.fullName ?? '') || deleteTarget?.email}?`}
 confirmLabel="Delete"
 confirmVariant="danger"
 onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
 onCancel={() => setDeleteTarget(null)}
 loading={deleteMut.isPending}
 />
 </div>
 );
}
