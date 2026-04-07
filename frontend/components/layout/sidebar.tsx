'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  ListIcon,
  XIcon,
  UserIcon,
  GitBranchIcon,
  UsersIcon,
  SignOutIcon,
  CalendarCheckIcon,
  UsersThreeIcon,
  GraduationCapIcon,
  FileTextIcon,
} from '@phosphor-icons/react';
import { signOut as nextAuthSignOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import { ROUTES } from '@/lib/routes';
import { USER_TYPE, USER_TYPE_LABELS, USER_TYPE_STYLES } from '@/lib/constants';
import { Spinner } from '@/components/ui/spinner';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; weight?: 'fill' | 'regular' | 'bold'; className?: string }>;
  adminOnly: boolean;
  superadminOnly: boolean;
}

interface NavGroup {
  label?: string;
  adminOnly?: boolean;
  superadminOnly?: boolean;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { href: ROUTES.DASHBOARD, label: 'Dashboard', icon: ChartBarIcon, adminOnly: false, superadminOnly: false },
    ],
  },
  {
    label: 'Tuition',
    items: [
      { href: ROUTES.PAYMENTS, label: 'Payments', icon: CurrencyDollarIcon, adminOnly: false, superadminOnly: false },
      { href: ROUTES.PAYMENT_PERIODS, label: 'Periods', icon: CalendarCheckIcon, adminOnly: true, superadminOnly: false },
    ],
  },
  {
    label: 'Students',
    adminOnly: true,
    items: [
      { href: ROUTES.FAMILIES, label: 'Families', icon: UsersThreeIcon, adminOnly: true, superadminOnly: false },
      { href: ROUTES.STUDENTS, label: 'Students', icon: GraduationCapIcon, adminOnly: true, superadminOnly: false },
    ],
  },
  {
    label: 'Admin',
    adminOnly: true,
    items: [
      { href: ROUTES.REPORTS, label: 'Reports', icon: FileTextIcon, adminOnly: true, superadminOnly: false },
      { href: ROUTES.AUDIT, label: 'Audit Log', icon: ClockIcon, adminOnly: true, superadminOnly: false },
      { href: ROUTES.USERS, label: 'Users', icon: UsersIcon, adminOnly: true, superadminOnly: false },
      { href: ROUTES.BRANCHES, label: 'Branches', icon: GitBranchIcon, adminOnly: false, superadminOnly: true },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { data: currentUser } = useCurrentUserQuery();

  const isAdmin = currentUser?.userType === USER_TYPE.ADMIN || currentUser?.userType === USER_TYPE.SUPERADMIN;
  const isSuperadmin = currentUser?.userType === USER_TYPE.SUPERADMIN;

  function filterItem(item: NavItem) {
    if (item.superadminOnly) return isSuperadmin;
    if (item.adminOnly) return isAdmin;
    return true;
  }

  function filterGroup(group: NavGroup) {
    if (group.superadminOnly) return isSuperadmin;
    if (group.adminOnly) return isAdmin;
    return true;
  }

  async function handleSignOut() {
    setShowSignOutDialog(false);
    setSigningOut(true);
    await nextAuthSignOut({ callbackUrl: ROUTES.LOGIN });
  }

  const navLinks = (
    <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
      {NAV_GROUPS.filter(filterGroup).map((group, gi) => {
        const visibleItems = group.items.filter(filterItem);
        if (visibleItems.length === 0) return null;
        return (
          <div key={gi}>
            {group.label && (
              <p className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {visibleItems.map(({ href, label, icon: Icon }) => {
                const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
                const itemClass = cn(
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors duration-150',
                  active
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                    : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800',
                );
                if (active) {
                  return (
                    <span key={href} className={itemClass}>
                      <Icon size={16} weight="fill" />
                      {label}
                    </span>
                  );
                }
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={itemClass}
                  >
                    <Icon size={16} weight="regular" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="px-3 py-4 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
      {currentUser && (
        <div className="flex items-center gap-2 px-2.5 mb-2">
          <UserIcon size={12} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
          <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate flex-1">
            {currentUser.nickname ?? currentUser.email}
          </span>
          <span className={cn(
            'shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide',
            USER_TYPE_STYLES[currentUser.userType] ?? USER_TYPE_STYLES.teacher,
          )}>
            {USER_TYPE_LABELS[currentUser.userType] ?? currentUser.userType}
          </span>
        </div>
      )}
      <ThemeToggle />
      <button
        onClick={() => setShowSignOutDialog(true)}
        className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-sm text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 transition-colors duration-150"
      >
        <SignOutIcon size={16} />
        Sign out
      </button>
    </div>
  );

  const sidebarContent = (
    <>
      <div className="px-5 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-zinc-950 dark:bg-white rounded-lg flex items-center justify-center">
          <GraduationCapIcon size={18} weight="fill" className="text-white dark:text-zinc-950" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 leading-none">Kumon Iligan</p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Ops Platform</p>
        </div>
      </div>
      {navLinks}
      {footer}
    </>
  );

  return (
    <>
      {/* Sign-out confirmation */}
      <Dialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign out?</DialogTitle>
            <DialogDescription>You will be returned to the login screen.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSignOutDialog(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleSignOut}>Sign out</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {signingOut && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-white/60 dark:bg-black/60">
          <div className="flex flex-col items-center gap-3">
            <Spinner size={24} className="text-zinc-500" />
            <span className="text-sm text-zinc-500 font-medium">Signing out...</span>
          </div>
        </div>
      )}

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 h-14 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 rounded-md transition-colors"
        >
          <ListIcon size={20} />
        </button>
        <div className="w-7 h-7 bg-zinc-950 dark:bg-white rounded-md flex items-center justify-center">
          <GraduationCapIcon size={14} weight="fill" className="text-white dark:text-zinc-950" />
        </div>
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Kumon Iligan</span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={cn(
        'lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-transform duration-200',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Menu</span>
          <button onClick={() => setMobileOpen(false)} className="p-1.5 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <XIcon size={16} />
          </button>
        </div>
        {navLinks}
        {footer}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-56 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex-col z-10">
        {sidebarContent}
      </aside>
    </>
  );
}
