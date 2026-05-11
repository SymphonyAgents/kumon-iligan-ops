'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { FAMILIES_KEY } from './useFamiliesQuery';

const memberKey = (familyId: string) => ['families', familyId, 'members'] as const;

export function useFamilyMembersQuery(familyId: string | null | undefined) {
  return useQuery({
    queryKey: familyId ? memberKey(familyId) : ['families', '__none__', 'members'],
    queryFn: () => api.familyMembers.list(familyId!),
    enabled: !!familyId,
  });
}

export function useCreateFamilyMemberMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      familyId,
      data,
    }: {
      familyId: string;
      data: Parameters<typeof api.familyMembers.create>[1];
    }) => api.familyMembers.create(familyId, data),
    onSuccess: (_, { familyId }) => {
      void qc.invalidateQueries({ queryKey: memberKey(familyId) });
      void qc.invalidateQueries({ queryKey: FAMILIES_KEY });
      toast.success('Member added');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to add member', { description: err.message }),
  });
}

export function useUpdateFamilyMemberMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      familyId,
      memberId,
      data,
    }: {
      familyId: string;
      memberId: string;
      data: Parameters<typeof api.familyMembers.update>[2];
    }) => api.familyMembers.update(familyId, memberId, data),
    onSuccess: (_, { familyId }) => {
      void qc.invalidateQueries({ queryKey: memberKey(familyId) });
      void qc.invalidateQueries({ queryKey: FAMILIES_KEY });
      toast.success('Member updated');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to update member', { description: err.message }),
  });
}

export function useDeleteFamilyMemberMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ familyId, memberId }: { familyId: string; memberId: string }) =>
      api.familyMembers.delete(familyId, memberId),
    onSuccess: (_, { familyId }) => {
      void qc.invalidateQueries({ queryKey: memberKey(familyId) });
      void qc.invalidateQueries({ queryKey: FAMILIES_KEY });
      toast.success('Member removed');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to remove member', { description: err.message }),
  });
}
