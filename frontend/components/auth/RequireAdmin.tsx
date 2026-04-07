'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import { USER_TYPE } from '@/lib/constants';

interface RequireAdminProps {
  children: React.ReactNode;
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading } = useCurrentUserQuery();

  // Teachers can access payments
  const teacherAllowedPaths = ['/payments'];
  const isTeacherAllowed = teacherAllowedPaths.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    if (!isLoading && user && user.userType === USER_TYPE.TEACHER && !isTeacherAllowed) {
      router.replace('/');
    }
  }, [user, isLoading, router, isTeacherAllowed]);

  if (isLoading) return null;
  if (!user) return null;
  if (user.userType === USER_TYPE.TEACHER && !isTeacherAllowed) return null;

  return <>{children}</>;
}
