'use client';

import { useMemo } from 'react';
import { LockSimpleIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { createUserColumns } from '@/columns/users-columns';
import { useUsersQuery, useUpdateUserRoleMutation } from '@/hooks/useUsersQuery';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import type { AppUser } from '@/lib/types';

export default function UsersPage() {
  const { data: currentUser, isSuccess: userLoaded } = useCurrentUserQuery();
  const isAdmin = currentUser?.userType === 'admin' || currentUser?.userType === 'superadmin';

  const { data: users = [], isLoading } = useUsersQuery();
  const updateRoleMut = useUpdateUserRoleMutation();

  const columns = useMemo(
    () => createUserColumns({
      onRoleChange: (id, userType) => {
        updateRoleMut.mutate(
          { id, userType },
          { onSuccess: () => toast.success('Role updated') },
        );
      },
      currentUserId: currentUser?.id,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser?.id],
  );

  if (userLoaded && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
          <LockSimpleIcon size={20} className="text-zinc-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-950">Access restricted</p>
          <p className="text-xs text-zinc-400 mt-0.5">User management is only available to admins.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage team roles and access"
      />
      <DataTable
        columns={columns}
        data={users as AppUser[]}
        isLoading={isLoading}
        loadingRows={4}
        emptyTitle="No users found"
        emptyDescription="Users appear here once they sign in."
      />
    </div>
  );
}
