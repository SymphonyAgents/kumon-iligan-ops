'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';

interface RequireAdminProps {
  children: React.ReactNode;
}

// Pages that staff can access in read-only mode (not fully restricted to admin)
const STAFF_ALLOWED_PATHS = ['/expenses'];

export function RequireAdmin({ children }: RequireAdminProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading } = useCurrentUserQuery();

  const isStaffAllowed = STAFF_ALLOWED_PATHS.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    if (!isLoading && user && user.userType === 'staff' && !isStaffAllowed) {
      router.replace('/transactions');
    }
  }, [user, isLoading, router, isStaffAllowed]);

  if (isLoading) return null;
  if (!user) return null;
  if (user.userType === 'staff' && !isStaffAllowed) return null;

  return <>{children}</>;
}
