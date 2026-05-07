'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import { USER_TYPE } from '@/lib/constants';

interface RequireSuperadminProps {
 children: React.ReactNode;
}

export function RequireSuperadmin({ children }: RequireSuperadminProps) {
 const router = useRouter();
 const { data: user, isLoading } = useCurrentUserQuery();

 useEffect(() => {
 if (!isLoading && user && user.userType !== USER_TYPE.SUPERADMIN) {
 router.replace('/');
 }
 }, [user, isLoading, router]);

 if (isLoading) return null;
 if (!user || user.userType !== USER_TYPE.SUPERADMIN) return null;

 return <>{children}</>;
}
