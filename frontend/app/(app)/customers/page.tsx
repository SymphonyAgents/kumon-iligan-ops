'use client';

import { LockSimpleIcon } from '@phosphor-icons/react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { customerColumns } from '@/columns/customers-columns';
import { useCustomersQuery } from '@/hooks/useCustomersQuery';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import type { Customer } from '@/lib/types';

export default function CustomersPage() {
  const { data: currentUser, isSuccess: userLoaded } = useCurrentUserQuery();
  const isAdmin = currentUser?.userType === 'admin' || currentUser?.userType === 'superadmin';

  const { data: customers = [], isLoading } = useCustomersQuery();

  if (userLoaded && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
          <LockSimpleIcon size={20} className="text-zinc-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-950">Access restricted</p>
          <p className="text-xs text-zinc-400 mt-0.5">Customer records are only available to admins.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="All registered customers"
      />
      <DataTable
        columns={customerColumns}
        data={customers as Customer[]}
        isLoading={isLoading}
        loadingRows={6}
        emptyTitle="No customers yet"
        emptyDescription="Customers are created automatically when a transaction is made."
      />
    </div>
  );
}
