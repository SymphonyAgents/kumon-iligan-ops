'use client';

import { GraduationCapIcon } from '@phosphor-icons/react';
import { signOut } from 'next-auth/react';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';

export default function PendingApprovalPage() {
 const { data: user } = useCurrentUserQuery();
 const isRejected = user?.status === 'rejected';

 function handleSignOut() {
 signOut({ callbackUrl: '/login' });
 }

 return (
 <main className="flex min-h-screen flex-col items-center justify-center bg-secondary/40">
 <div className="flex flex-col items-center gap-8 max-w-sm text-center px-4">
 <div className="w-16 h-16 bg-secondary dark:bg-card rounded-2xl flex items-center justify-center">
 <GraduationCapIcon size={32} weight="fill" className="text-white dark:text-foreground" />
 </div>
 {isRejected ? (
 <>
 <div className="flex flex-col items-center gap-2">
 <div className="w-12 h-12 rounded-full bg-err-soft dark:bg-red-950 flex items-center justify-center mb-1">
 <svg width="20" height="20" viewBox="0 0 24 24"fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-err">
 <circle cx="12" cy="12" r="10" />
 <line x1="15" y1="9" x2="9" y2="15" />
 <line x1="9" y1="9" x2="15" y2="15" />
 </svg>
 </div>
 <h1 className="text-xl font-semibold text-foreground tracking-tight">Access denied</h1>
 <p className="text-sm text-muted-foreground">
 Your account request has been declined. If you believe this is a mistake, contact your administrator.
 </p>
 </div>
 </>
 ) : (
 <>
 <div className="flex flex-col items-center gap-2">
 <div className="w-12 h-12 rounded-full bg-warn-soft dark:bg-amber-950 flex items-center justify-center mb-1">
 <svg width="20" height="20" viewBox="0 0 24 24"fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warn">
 <circle cx="12" cy="12" r="10" />
 <polyline points="12 6 12 12 16 14" />
 </svg>
 </div>
 <h1 className="text-xl font-semibold text-foreground tracking-tight">Pending approval</h1>
 <p className="text-sm text-muted-foreground">
 Your account is awaiting approval from an administrator. You&apos;ll be able to sign in once approved.
 </p>
 </div>
 </>
 )}
 <button
 onClick={handleSignOut}
 className="px-5 py-2.5 bg-secondary dark:bg-card text-white dark:text-foreground text-sm font-medium rounded-lg hover:bg-secondary dark:hover:bg-secondary active:scale-[0.98] transition-all duration-150 cursor-pointer"
 >
 Sign out
 </button>
 </div>
 </main>
 );
}
