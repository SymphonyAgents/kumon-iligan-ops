'use client';

import { useMemo, useState } from 'react';
import { LockSimpleIcon, XIcon } from '@phosphor-icons/react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { customerColumns } from '@/columns/customers-columns';
import { useCustomersQuery } from '@/hooks/useCustomersQuery';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Customer } from '@/lib/types';

type ShoesSort = 'default' | 'asc' | 'desc';

const INPUT_CLS = 'h-9 px-3 text-sm bg-white border border-zinc-200 rounded-md text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-36';

export default function CustomersPage() {
  const { data: currentUser, isSuccess: userLoaded } = useCurrentUserQuery();
  const isAdmin = currentUser?.userType === 'admin' || currentUser?.userType === 'superadmin';

  const { data: customers = [], isLoading } = useCustomersQuery();

  const [filterCity, setFilterCity] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [shoesSort, setShoesSort] = useState<ShoesSort>('default');

  function clearFilters() {
    setFilterCity('');
    setFilterSearch('');
  }

  const hasFilter = filterCity || filterSearch;

  const filtered = useMemo(() => {
    let list = customers as Customer[];
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      list = list.filter((c) =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q),
      );
    }
    if (filterCity) list = list.filter((c) => c.city?.toLowerCase().includes(filterCity.toLowerCase()));
    if (shoesSort === 'desc') {
      list = [...list].sort((a, b) => (b.shoesCount ?? 0) - (a.shoesCount ?? 0));
    } else if (shoesSort === 'asc') {
      list = [...list].sort((a, b) => (a.shoesCount ?? 0) - (b.shoesCount ?? 0));
    }
    return list;
  }, [customers, filterSearch, filterCity, shoesSort]);

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

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {/* Name / phone / email search */}
        <input
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          placeholder="Search name, phone, email"
          className="h-9 px-3 text-sm bg-white border border-zinc-200 rounded-md text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-52"
        />

        {/* City */}
        <input
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
          placeholder="City"
          className={INPUT_CLS}
        />

        {/* Clear */}
        {hasFilter && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2.5 h-9 text-xs text-zinc-500 hover:text-zinc-950 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
          >
            <XIcon size={12} />
            Clear
          </button>
        )}

        <Select value={shoesSort} onValueChange={(v) => setShoesSort(v as ShoesSort)}>
          <SelectTrigger className="h-9 text-sm w-44 border-zinc-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Shoes: Default</SelectItem>
            <SelectItem value="desc">Shoes: High → Low</SelectItem>
            <SelectItem value="asc">Shoes: Low → High</SelectItem>
          </SelectContent>
        </Select>
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
