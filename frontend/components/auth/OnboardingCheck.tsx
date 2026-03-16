'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import { Spinner } from '@/components/ui/spinner';

export function OnboardingCheck() {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUserQuery();

  const isPending = !isLoading && !!user && user.status === 'pending';
  const isRejected = !isLoading && !!user && user.status === 'rejected';
  const needsOnboarding = !isLoading && !!user && user.status === 'active' && user.branchId === null;

  // Force logout + redirect when Supabase refresh token is invalid/expired
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
        router.push('/login');
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (isPending || isRejected) {
      router.push('/pending');
    } else if (needsOnboarding) {
      router.push('/onboarding');
    }
  }, [isPending, isRejected, needsOnboarding, router]);

  if (isLoading || needsOnboarding || isPending || isRejected) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
        <Spinner size={24} className="text-zinc-400" />
      </div>
    );
  }

  return null;
}
