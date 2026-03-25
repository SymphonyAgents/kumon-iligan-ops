'use client';

import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';

export default function PendingApprovalPage() {
  const { data: user } = useCurrentUserQuery();
  const isRejected = user?.status === 'rejected';

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50">
      <div className="flex flex-col items-center gap-8 max-w-sm text-center px-4">
        <Image
          src="/sneaker-doc-logo.png"
          alt="SneakerDoc"
          width={120}
          height={120}
          priority
          className="object-contain"
        />
        {isRejected ? (
          <>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">Access denied</h1>
              <p className="text-sm text-zinc-400">
                Your account request has been declined. If you believe this is a mistake, contact your administrator.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">Pending approval</h1>
              <p className="text-sm text-zinc-400">
                Your account is awaiting approval from an administrator. You&apos;ll be able to sign in once approved.
              </p>
            </div>
          </>
        )}
        <button
          onClick={handleSignOut}
          className="px-5 py-2.5 bg-zinc-950 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 active:scale-[0.98] transition-all duration-150 cursor-pointer"
        >
          Sign out
        </button>
      </div>
    </main>
  );
}
