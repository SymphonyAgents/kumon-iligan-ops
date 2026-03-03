'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';

const USERS_KEY = ['users'];

export function useUsersQuery() {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: () => api.users.list(),
    staleTime: 60 * 1000,
  });
}

export function useUpdateUserRoleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userType }: { id: string; userType: string }) =>
      api.users.updateRole(id, userType),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: USERS_KEY });
    },
    onError: (err: Error) => toast.error('Failed to update role', { description: err.message }),
  });
}

export function useUpdateUserBranchMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, branchId }: { id: string; branchId: number }) =>
      api.users.updateBranch(id, branchId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: USERS_KEY });
    },
    onError: (err: Error) => toast.error('Failed to update branch', { description: err.message }),
  });
}

export function useDeleteUserMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.users.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: USERS_KEY });
      toast.success('User removed');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to remove user', { description: err.message }),
  });
}
