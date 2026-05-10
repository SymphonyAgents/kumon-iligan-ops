'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { AppUser } from '@/lib/types';

const USERS_KEY = ['users'];
const ASSIGNABLE_KEY = ['users', 'assignable'];

export function useUsersQuery(branchId?: string) {
  return useQuery({
    queryKey: [...USERS_KEY, branchId],
    queryFn: () => api.users.list(branchId),
  });
}

export function useUserQuery(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => api.users.get(id),
    enabled: !!id,
  });
}

export function useAssignableUsersQuery(branchId?: string | null) {
  return useQuery({
    queryKey: [...ASSIGNABLE_KEY, branchId],
    queryFn: () => api.users.assignable(branchId),
    staleTime: 5 * 60 * 1000,
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
    mutationFn: ({ id, branchId }: { id: string; branchId: string }) =>
      api.users.updateBranch(id, branchId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: USERS_KEY });
    },
    onError: (err: Error) => toast.error('Failed to update branch', { description: err.message }),
  });
}

export function useApproveUserMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.users.approve(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: USERS_KEY });
      toast.success('User approved');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to approve user', { description: err.message }),
  });
}

export function useRejectUserMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.users.reject(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: USERS_KEY });
      toast.success('User rejected');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to reject user', { description: err.message }),
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

export function useUpdateUserProfileMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AppUser> }) =>
      api.users.updateProfile(id, data),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: USERS_KEY });
      void qc.invalidateQueries({ queryKey: ['users', id] });
      toast.success('Profile updated');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to update profile', { description: err.message }),
  });
}
