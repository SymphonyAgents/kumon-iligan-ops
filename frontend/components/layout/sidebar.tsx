'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ListIcon, XIcon, SignOutIcon } from '@phosphor-icons/react';
import { signOut as nextAuthSignOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import { ROUTES } from '@/lib/routes';
import { USER_TYPE, USER_TYPE_LABELS } from '@/lib/constants';
import { Spinner } from '@/components/ui/spinner';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { CounterPill } from '@/components/ui/counter-pill';
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
  count?: number;
  urgent?: boolean;
  adminOnly?: boolean;
  superadminOnly?: boolean;
  teacherOnly?: boolean;
}

interface NavGroup {
 label?: string;
 adminOnly?: boolean;
 superadminOnly?: boolean;
 items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ href: ROUTES.DASHBOARD, label: 'Dashboard' }],
  },
  {
    label: 'Tuition',
    items: [
      { href: ROUTES.SDC, label: 'My Students', teacherOnly: true },
      { href: ROUTES.RECORDINGS, label: 'My Recordings', teacherOnly: true },
      { href: ROUTES.PAYMENTS, label: 'All Payments', adminOnly: true },
      { href: ROUTES.PAYMENT_PERIODS, label: 'Periods', adminOnly: true },
    ],
  },
  {
    label: 'Roster',
    adminOnly: true,
    items: [
      { href: ROUTES.FAMILIES, label: 'Families' },
      { href: ROUTES.STUDENTS, label: 'Students' },
    ],
  },
  {
    label: 'Admin',
    adminOnly: true,
    items: [
      { href: ROUTES.REPORTS, label: 'Reports' },
      { href: ROUTES.AUDIT, label: 'Audit Log' },
      { href: ROUTES.USERS, label: 'Users' },
      { href: ROUTES.BRANCHES, label: 'Branches', superadminOnly: true },
    ],
  },
];

function initials(input?: string | null): string {
 if (!input) return '?';
 const parts = input.trim().split(/\s+/);
 if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
 return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Sidebar() {
 const pathname = usePathname();
 const [mobileOpen, setMobileOpen] = useState(false);
 const [showSignOutDialog, setShowSignOutDialog] = useState(false);
 const [signingOut, setSigningOut] = useState(false);
 const { data: currentUser } = useCurrentUserQuery();

  const isAdmin =
    currentUser?.userType === USER_TYPE.ADMIN || currentUser?.userType === USER_TYPE.SUPERADMIN;
  const isSuperadmin = currentUser?.userType === USER_TYPE.SUPERADMIN;
  const isTeacher = currentUser?.userType === USER_TYPE.TEACHER;

  function filterItem(item: NavItem) {
    if (item.superadminOnly) return isSuperadmin;
    if (item.adminOnly) return isAdmin;
    if (item.teacherOnly) return isTeacher;
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

  // Header (spec: 32x32 forest-green rounded square + stacked name/role)
  const header = (
    <div className="flex items-center gap-2.5 px-6 pt-1 pb-6">
      <div className="w-8 h-8 rounded-[9px] bg-primary text-primary-foreground flex items-center justify-center font-semibold text-base shrink-0">
        K
      </div>
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium text-foreground tracking-[-0.1px] leading-tight truncate">
          Kumon Iligan
        </p>
        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
          {currentUser ? USER_TYPE_LABELS[currentUser.userType] ?? 'Teacher' : 'Teacher'}
        </p>
      </div>
    </div>
  );

  // Nav. Hit-area = full sidebar width; the visible pill stays inset via mx-3 so the
  // rounded shape doesn't touch the sidebar edge.
  const nav = (
    <div className="flex-1 flex flex-col gap-5 overflow-y-auto">
      {NAV_GROUPS.filter(filterGroup).map((group, gi) => {
        const visibleItems = group.items.filter(filterItem);
        if (visibleItems.length === 0) return null;
        return (
          <div key={gi} className="flex flex-col gap-0.5">
            {group.label && (
              <p className="px-6 mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                {group.label}
              </p>
            )}
            {visibleItems.map(({ href, label, count, urgent }) => {
              const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="group block w-full"
                >
                  <span
                    className={cn(
                      'mx-3 flex items-center justify-between gap-2 rounded-[9px] px-3 py-2.5 text-[14px] transition-colors duration-150',
                      active
                        ? 'bg-secondary text-foreground font-medium'
                        : 'bg-transparent text-muted-foreground font-normal group-hover:bg-secondary/60 group-hover:text-foreground',
                    )}
                  >
                    <span className="truncate">{label}</span>
                    {count !== undefined && (
                      <CounterPill
                        count={count}
                        variant={urgent ? 'urgent' : active ? 'active' : 'default'}
                      />
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </div>
  );

 // Footer user card (spec: 12px padding, radius 10, border, 28px circle accentSoft avatar)
 const userCard = currentUser ? (
 <div className="rounded-[10px] border border-border p-3 flex items-center gap-2.5">
 <div className="w-7 h-7 rounded-full bg-accent-soft text-accent-foreground flex items-center justify-center text-[11px] font-semibold shrink-0">
 {initials(currentUser.nickname ?? currentUser.fullName ?? currentUser.email)}
 </div>
 <div className="min-w-0 flex-1">
 <p className="text-[13px] font-medium text-foreground leading-tight truncate">
 {currentUser.nickname ?? currentUser.fullName ?? currentUser.email}
 </p>
 <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
 Iligan Branch
 </p>
 </div>
 </div>
 ) : null;

  const footer = (
    <div className="flex flex-col gap-2 px-6 pt-3 pb-1">
      {userCard}
      <div className="flex items-center justify-end gap-1">
        <ThemeToggle />
        <button
          type="button"
          onClick={() => setShowSignOutDialog(true)}
          className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150"
          aria-label="Sign out"
          title="Sign out"
        >
          <SignOutIcon size={16} />
        </button>
      </div>
    </div>
  );

  const sidebarBody = (
    <div className="flex flex-col h-full pt-6 pb-4">
      {header}
      {nav}
      {footer}
    </div>
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
 <Button variant="ghost" onClick={() => setShowSignOutDialog(false)}>
 Cancel
 </Button>
 <Button variant="danger" onClick={handleSignOut}>
 Sign out
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {signingOut && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-background/60">
 <div className="flex flex-col items-center gap-3">
 <Spinner size={24} className="text-muted-foreground" />
 <span className="text-sm text-muted-foreground font-medium">Signing out...</span>
 </div>
 </div>
 )}

 {/* Mobile top bar */}
 <div className="lg:hidden fixed top-0 left-0 right-0 z-20 h-14 bg-card border-b border-border flex items-center px-4 gap-3">
 <button
 onClick={() => setMobileOpen(true)}
 className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
 >
 <ListIcon size={20} />
 </button>
 <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
 K
 </div>
 <span className="text-sm font-medium text-foreground tracking-[-0.1px]">Kumon Iligan</span>
 </div>

 {/* Mobile overlay */}
 {mobileOpen && (
 <div className="lg:hidden fixed inset-0 z-30 bg-black/40"
 onClick={() => setMobileOpen(false)}
 />
 )}

 {/* Mobile drawer */}
 <aside
 className={cn(
 'lg:hidden fixed inset-y-0 left-0 z-40 w-[260px] bg-background border-r border-border flex flex-col transition-transform duration-200',
 mobileOpen ? 'translate-x-0' : '-translate-x-full',
 )}
 >
 <div className="flex items-center justify-end px-3 pt-3">
 <button
 onClick={() => setMobileOpen(false)}
 className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
 >
 <XIcon size={16} />
 </button>
 </div>
 {sidebarBody}
 </aside>

 {/* Desktop sidebar (spec: 232px wide, bg = canvas, right border) */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-[232px] bg-background border-r border-border z-10">
 {sidebarBody}
 </aside>
 </>
 );
}
