'use client';

import { useMemo, useState } from 'react';
import { LockSimpleIcon } from '@phosphor-icons/react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { customerColumns } from '@/columns/customers-columns';
import { useCustomersQuery } from '@/hooks/useCustomersQuery';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import type { Customer } from '@/lib/types';

type ShoesSort = 'default' | 'asc' | 'desc';

export default function CustomersPage() {
  const { data: currentUser, isSuccess: userLoaded } = useCurrentUserQuery();
  const isAdmin = currentUser?.userType === 'admin' || currentUser?.userType === 'superadmin';

  const { data: customers = [], isLoading } = useCustomersQuery();

  const [cityFilter, setCityFilter] = useState('');
  const [shoesSort, setShoesSort] = useState<ShoesSort>('default');

  const filtered = useMemo(() => {
    let list = customers as Customer[];
    if (cityFilter.trim()) {
      const q = cityFilter.trim().toLowerCase();
      list = list.filter((c) => c.city?.toLowerCase().includes(q));
    }
    if (shoesSort === 'desc') {
      list = [...list].sort((a, b) => (b.shoesCount ?? 0) - (a.shoesCount ?? 0));
    } else if (shoesSort === 'asc') {
      list = [...list].sort((a, b) => (a.shoesCount ?? 0) - (b.shoesCount ?? 0));
    }
    return list;
  }, [customers, cityFilter, shoesSort]);

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
        subtitle={`${filtered.length} customer${filtered.length !== 1 ? 's' : ''}`}
      />

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <input
          type="text"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          placeholder="Filter by city..."
          className="px-3 py-2 text-sm bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-48"
        />
        <select
          value={shoesSort}
          onChange={(e) => setShoesSort(e.target.value as ShoesSort)}
          className="px-3 py-2 text-sm bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="default">Shoes: Default</option>
          <option value="desc">Shoes: High → Low</option>
          <option value="asc">Shoes: Low → High</option>
        </select>
      </div>

      <DataTable
        columns={customerColumns}
        data={filtered}
        isLoading={isLoading}
        loadingRows={6}
        emptyTitle="No customers yet"
        emptyDescription="Customers are created automatically when a transaction is made."
      />
    </div>
  );
}
