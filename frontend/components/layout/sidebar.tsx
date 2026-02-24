'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ReceiptIcon,
  WrenchIcon,
  TagIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard/transactions', label: 'Transactions', icon: ReceiptIcon },
  { href: '/dashboard/services', label: 'Services', icon: WrenchIcon },
  { href: '/dashboard/promos', label: 'Promos', icon: TagIcon },
  { href: '/dashboard/expenses', label: 'Expenses', icon: CurrencyDollarIcon },
  { href: '/dashboard/reports', label: 'Reports', icon: ChartBarIcon },
  { href: '/dashboard/audit', label: 'Audit Log', icon: ClockIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-56 bg-white border-r border-zinc-200 flex flex-col z-10">
      <div className="px-5 py-5 border-b border-zinc-200">
        <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">SneakerDoc</p>
        <p className="text-sm font-semibold text-zinc-950 mt-0.5">POS Admin</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors duration-150',
                active
                  ? 'bg-zinc-950 text-white'
                  : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100',
              )}
            >
              <Icon size={16} weight={active ? 'fill' : 'regular'} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-zinc-200">
        <p className="text-xs text-zinc-400">Philippine Peso (₱)</p>
      </div>
    </aside>
  );
}
