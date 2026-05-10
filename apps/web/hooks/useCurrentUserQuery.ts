'use client';

import { useQuery } from '@tanstack/react-query';
import { signOut } from 'next-auth/react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/api';

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      try {
        return await api.users.getCurrent();
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
          signOut({ callbackUrl: '/login' });
        }
        throw err;
      }
    },
    retry: false,
  });
}
