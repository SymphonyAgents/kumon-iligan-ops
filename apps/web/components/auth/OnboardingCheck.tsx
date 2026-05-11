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

  // Redirect to login if session is lost
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (isPending || isRejected) {
      router.push('/pending');
    }
  }, [isPending, isRejected, router]);

  if (isLoading || isPending || isRejected) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-card">
        <Spinner size={24} className="text-muted-foreground" />
      </div>
    );
  }

  return null;
}
