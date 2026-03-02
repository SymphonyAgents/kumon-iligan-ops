'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import { Spinner } from '@/components/ui/spinner';

export function OnboardingCheck() {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUserQuery();

  const needsOnboarding = !isLoading && !!user && user.branchId === null;

  useEffect(() => {
    if (needsOnboarding) {
      router.push('/onboarding');
    }
  }, [needsOnboarding, router]);

  if (isLoading || needsOnboarding) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
        <Spinner size={24} className="text-zinc-400" />
      </div>
    );
  }

  return null;
}
