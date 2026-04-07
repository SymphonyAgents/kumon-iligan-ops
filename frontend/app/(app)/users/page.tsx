'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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
  const [tab, setTab] = useState<Tab>('active');
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
    return branches.find(b => b.id === branchId)?.name ?? '—';
  }

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage teachers and admin accounts" />

      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-fit mb-4">
        {(['active', 'pending'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize flex items-center gap-1.5 ${
              tab === t
                ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
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
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          title={tab === 'pending' ? 'No pending users' : 'No active users'}
          description={tab === 'pending' ? 'New users will appear here awaiting approval.' : undefined}
        />
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">User</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">Role</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden md:table-cell">Branch</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                  {isSuperadmin && <th className="text-right px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">{u.fullName ?? u.nickname ?? '—'}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {isSuperadmin && u.id !== currentUser?.id ? (
                        <select
                          value={u.userType}
                          onChange={e => roleMut.mutate({ id: u.id, userType: e.target.value })}
                          className="text-xs px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {Object.entries(USER_TYPE_LABELS).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">{USER_TYPE_LABELS[u.userType]}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {isSuperadmin && branches.length > 1 && u.id !== currentUser?.id ? (
                        <select
                          value={u.branchId ?? ''}
                          onChange={e => branchMut.mutate({ id: u.id, branchId: e.target.value })}
                          className="text-xs px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">No branch</option>
                          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      ) : (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">{getBranchName(u.branchId)}</span>
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
                                className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                              >
                                <CheckIcon size={14} weight="bold" />
                              </button>
                              <button
                                onClick={() => setRejectTarget(u)}
                                title="Reject"
                                className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                              >
                                <XIcon size={14} weight="bold" />
                              </button>
                            </>
                          )}
                          {u.id !== currentUser?.id && (
                            <button
                              onClick={() => setDeleteTarget(u)}
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

      <ConfirmDialog
        open={!!approveTarget}
        title="Approve User"
        description={`Approve ${approveTarget?.fullName ?? approveTarget?.email} as ${USER_TYPE_LABELS[approveTarget?.userType ?? 'teacher']}?`}
        confirmLabel="Approve"
        onConfirm={() => approveTarget && approveMut.mutate(approveTarget.id)}
        onCancel={() => setApproveTarget(null)}
        loading={approveMut.isPending}
      />
      <ConfirmDialog
        open={!!rejectTarget}
        title="Reject User"
        description={`Reject and remove ${rejectTarget?.fullName ?? rejectTarget?.email}? They will not be able to access the system.`}
        confirmLabel="Reject"
        confirmVariant="danger"
        onConfirm={() => rejectTarget && rejectMut.mutate(rejectTarget.id)}
        onCancel={() => setRejectTarget(null)}
        loading={rejectMut.isPending}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete User"
        description={`Permanently remove ${deleteTarget?.fullName ?? deleteTarget?.email}?`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
