'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useStudentsQuery, useEnrollStudentMutation, useChangeStudentStatusMutation, useAssignTeacherMutation, useDeleteStudentMutation } from '@/hooks/useStudentsQuery';
import { useFamiliesQuery } from '@/hooks/useFamiliesQuery';
import { useAssignableUsersQuery } from '@/hooks/useUsersQuery';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import { STUDENT_STATUS, USER_TYPE } from '@/lib/constants';
import type { Student, Family } from '@/lib/types';
import { PlusIcon, ArrowsClockwiseIcon, TrashIcon } from '@phosphor-icons/react';

// ---- Enroll Student Dialog ----
function EnrollStudentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [familyId, setFamilyId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [level, setLevel] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: families = [], isLoading: familiesLoading } = useFamiliesQuery();
  const enrollMut = useEnrollStudentMutation(() => {
    onClose();
    setFamilyId(''); setFirstName(''); setLastName(''); setLevel('');
    setEnrollmentDate(new Date().toISOString().split('T')[0]);
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    enrollMut.mutate({ familyId, firstName: firstName.trim(), lastName: lastName.trim(), level: level.trim() || undefined, enrollmentDate });
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Enroll Student</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Family *</label>
            <select
              value={familyId}
              onChange={e => setFamilyId(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">Select family…</option>
              {families.map(f => <option key={f.id} value={f.id}>{f.guardianName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">First Name *</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
                placeholder="Given name"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Last Name *</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
                placeholder="Surname"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Kumon Level</label>
            <input
              type="text"
              value={level}
              onChange={e => setLevel(e.target.value)}
              placeholder="e.g. Level D, Level F…"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Enrollment Date *</label>
            <input
              type="date"
              value={enrollmentDate}
              onChange={e => setEnrollmentDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={enrollMut.isPending}>
              {enrollMut.isPending ? 'Enrolling…' : 'Enroll Student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---- Assign Teacher Dialog ----
function AssignTeacherDialog({ open, student, onClose }: { open: boolean; student: Student | null; onClose: () => void }) {
  const [teacherId, setTeacherId] = useState('');
  const { data: teachers = [] } = useAssignableUsersQuery(student?.branchId);
  const assignMut = useAssignTeacherMutation(onClose);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!student || !teacherId) return;
    assignMut.mutate({ studentId: student.id, teacherId });
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Teacher — {student?.firstName} {student?.lastName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Teacher *</label>
            <select
              value={teacherId}
              onChange={e => setTeacherId(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">Select teacher…</option>
              {teachers.filter(t => t.userType === USER_TYPE.TEACHER).map(t => (
                <option key={t.id} value={t.id}>{t.fullName ?? t.nickname ?? t.email}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={assignMut.isPending}>
              {assignMut.isPending ? 'Assigning…' : 'Assign Teacher'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentsPage() {
  const [statusFilter, setStatusFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [showEnroll, setShowEnroll] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  const { data: currentUser } = useCurrentUserQuery();
  const isAdmin = currentUser?.userType === USER_TYPE.ADMIN || currentUser?.userType === USER_TYPE.SUPERADMIN;
  const isSuperadmin = currentUser?.userType === USER_TYPE.SUPERADMIN;

  const { data: students = [], isLoading } = useStudentsQuery(
    statusFilter ? { status: statusFilter } : undefined
  );
  const deleteMut = useDeleteStudentMutation(() => setDeleteTarget(null));
  const changeStatusMut = useChangeStudentStatusMutation();

  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(s =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.guardianName?.toLowerCase().includes(q) ||
      s.teacherName?.toLowerCase().includes(q) ||
      s.level?.toLowerCase().includes(q)
    );
  }, [students, search]);

  const statuses = [
    { label: 'Active', value: STUDENT_STATUS.ACTIVE },
    { label: 'Inactive', value: STUDENT_STATUS.INACTIVE },
    { label: 'Withdrawn', value: STUDENT_STATUS.WITHDRAWN },
    { label: 'All', value: '' },
  ];

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle="Enrolled students"
        action={
          isAdmin ? (
            <Button onClick={() => setShowEnroll(true)}>
              <PlusIcon weight="bold" size={14} />
              Enroll Student
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          {statuses.map(s => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === s.value
                  ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, guardian, or teacher…"
          className="flex-1 px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No students found"
          description={statusFilter === STUDENT_STATUS.ACTIVE ? 'No active students. Enroll one using the button above.' : 'No students match this filter.'}
          action={isAdmin ? <Button onClick={() => setShowEnroll(true)}><PlusIcon size={14} weight="bold" />Enroll Student</Button> : undefined}
        />
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">Student</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">Level</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden md:table-cell">Teacher</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                  {isAdmin && <th className="text-right px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filtered.map(s => (
                  <tr key={s.id} className="bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">{s.guardianName}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-zinc-500 dark:text-zinc-400 text-xs">
                      {s.level ?? <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-zinc-500 dark:text-zinc-400 text-xs">
                      {s.teacherName ?? <span className="text-zinc-300 dark:text-zinc-600">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setAssignTarget(s)}
                            title="Assign teacher"
                            className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-blue-600 transition-colors"
                          >
                            <ArrowsClockwiseIcon size={14} />
                          </button>
                          {s.status === STUDENT_STATUS.ACTIVE && (
                            <button
                              onClick={() => changeStatusMut.mutate({ id: s.id, data: { status: STUDENT_STATUS.INACTIVE } })}
                              title="Mark inactive"
                              className="px-2 py-1 rounded text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors"
                            >
                              Deactivate
                            </button>
                          )}
                          {s.status === STUDENT_STATUS.INACTIVE && (
                            <button
                              onClick={() => changeStatusMut.mutate({ id: s.id, data: { status: STUDENT_STATUS.ACTIVE } })}
                              title="Mark active"
                              className="px-2 py-1 rounded text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                            >
                              Activate
                            </button>
                          )}
                          {isSuperadmin && (
                            <button
                              onClick={() => setDeleteTarget(s)}
                              className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-red-500 transition-colors"
                            >
                              <TrashIcon size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EnrollStudentDialog open={showEnroll} onClose={() => setShowEnroll(false)} />
      <AssignTeacherDialog open={!!assignTarget} student={assignTarget} onClose={() => setAssignTarget(null)} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove Student"
        description={`Remove ${deleteTarget?.firstName} ${deleteTarget?.lastName}? All associated payments and periods will be soft-deleted. This cannot be undone.`}
        confirmLabel="Remove"
        confirmVariant="danger"
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
