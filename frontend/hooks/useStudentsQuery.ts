'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export const STUDENTS_KEY = ['students'] as const;

export function useStudentsQuery(params?: Parameters<typeof api.students.list>[0]) {
  return useQuery({
    queryKey: [...STUDENTS_KEY, params],
    queryFn: () => api.students.list(params),
  });
}

export function useStudentQuery(id: string) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: () => api.students.get(id),
    enabled: !!id,
  });
}

export function useEnrollStudentMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.students.enroll>[0]) => api.students.enroll(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: STUDENTS_KEY });
      toast.success('Student enrolled');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to enroll student', { description: err.message }),
  });
}

export function useUpdateStudentMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.students.update>[1] }) =>
      api.students.update(id, data),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: STUDENTS_KEY });
      void qc.invalidateQueries({ queryKey: ['students', id] });
      toast.success('Student updated');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to update student', { description: err.message }),
  });
}

export function useChangeStudentStatusMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.students.changeStatus>[1] }) =>
      api.students.changeStatus(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: STUDENTS_KEY });
      toast.success('Student status updated');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to update status', { description: err.message }),
  });
}

export function useAssignTeacherMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, teacherId }: { studentId: string; teacherId: string }) =>
      api.students.assignTeacher(studentId, { teacherId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: STUDENTS_KEY });
      toast.success('Teacher assigned');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to assign teacher', { description: err.message }),
  });
}

export function useDeleteStudentMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.students.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: STUDENTS_KEY });
      toast.success('Student removed');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error('Failed to remove student', { description: err.message }),
  });
}
