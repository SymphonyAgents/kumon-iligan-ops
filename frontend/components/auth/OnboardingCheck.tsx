'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import { Spinner } from '@/components/ui/spinner';

export function OnboardingCheck() {
  const router = useRouter();
  const { status } = useSession();
  const { data: user, isLoading } = useCurrentUserQuery();

  const isPending = !isLoading && !!user && user.status === 'pending';
  const isRejected = !isLoading && !!user && user.status === 'rejected';
  const needsOnboarding = !isLoading && !!user && user.status === 'active' && user.branchId === null;

  // Redirect to login if session is lost
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (isPending || isRejected) {
      router.push('/pending');
    } else if (needsOnboarding) {
      router.push('/onboarding');
    }
  }, [isPending, isRejected, needsOnboarding, router]);

  if (isLoading || needsOnboarding || isPending || isRejected) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-zinc-950">
        <Spinner size={24} className="text-zinc-400" />
      </div>
    );
  }

  return null;
}
