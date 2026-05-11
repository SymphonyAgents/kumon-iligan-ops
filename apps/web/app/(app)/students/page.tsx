'use client';

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Combobox } from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/date-picker';
import { StudentImportDialog } from '@/components/students/StudentImportDialog';
import { DataCardList } from '@/components/ui/data-card-list';
import { useUrlParam } from '@/hooks/useUrlParam';
import { toTitleCase, fullName } from '@/utils/text';
import { UploadSimpleIcon } from '@phosphor-icons/react';
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
 <form onSubmit={handleSubmit}  className="flex flex-col gap-4 mt-2">
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-medium text-foreground">Family *</label>
          <Combobox
            options={families.map((f) => ({
              value: f.id,
              label: toTitleCase(f.guardianName),
              description: f.guardianPhone,
              keywords: `${f.guardianName} ${f.guardianPhone ?? ''}`,
            }))}
            value={familyId}
            onChange={setFamilyId}
            placeholder={familiesLoading ? 'Loading families…' : 'Select family…'}
            searchPlaceholder="Search by guardian name or phone"
            emptyMessage="No families match."
          />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-medium text-foreground">First Name *</label>
 <input
 type="text"
 value={firstName}
 onChange={e => setFirstName(e.target.value)}
 required
 placeholder="Given name"
 className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
 />
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-medium text-foreground">Last Name *</label>
 <input
 type="text"
 value={lastName}
 onChange={e => setLastName(e.target.value)}
 required
 placeholder="Surname"
 className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
 />
 </div>
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-medium text-foreground">Kumon Level</label>
 <input
 type="text"
 value={level}
 onChange={e => setLevel(e.target.value)}
 placeholder="e.g. Level D, Level F…"
 className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
 />
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-medium text-foreground">Enrollment Date *</label>
          <DatePicker value={enrollmentDate} onChange={setEnrollmentDate} />
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
 const { data: allStudents = [] } = useStudentsQuery({ status: 'active' });
 const assignMut = useAssignTeacherMutation(onClose);

 // Pre-fill with the student's current teacher when the dialog opens / target changes.
 useEffect(() => {
 setTeacherId(student?.teacherId ?? '');
 }, [student?.id, student?.teacherId]);

 const studentsByTeacher = useMemo(() => {
 const map = new Map<string, number>();
 for (const s of allStudents) {
 if (!s.teacherId) continue;
 map.set(s.teacherId, (map.get(s.teacherId) ?? 0) + 1);
 }
 return map;
 }, [allStudents]);

 function handleSubmit(e: React.FormEvent) {
 e.preventDefault();
 if (!student || !teacherId) return;
 if (teacherId === student.teacherId) { onClose(); return; }
 assignMut.mutate({ studentId: student.id, teacherId });
 }

 return (
 <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
 <DialogContent className="max-w-sm">
 <DialogHeader>
          <DialogTitle>Assign Teacher — {fullName(student?.firstName, student?.lastName)}</DialogTitle>
 </DialogHeader>
 <form onSubmit={handleSubmit}  className="flex flex-col gap-4 mt-2">
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-medium text-foreground">Teacher *</label>
          <Combobox
            options={teachers
              .filter((t) => t.userType === USER_TYPE.TEACHER)
              .map((t) => {
                const count = studentsByTeacher.get(t.id) ?? 0;
                const isCurrent = student?.teacherId === t.id;
                return {
                  value: t.id,
                  label: toTitleCase(t.fullName ?? t.nickname ?? '') || t.email,
                  description: isCurrent ? 'currently assigned' : undefined,
                  trailing: `${count} student${count === 1 ? '' : 's'}`,
                  keywords: `${t.fullName ?? ''} ${t.nickname ?? ''} ${t.email}`,
                };
              })}
            value={teacherId}
            onChange={setTeacherId}
            placeholder="Select teacher…"
            searchPlaceholder="Search teachers"
            emptyMessage="No teachers available."
          />
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
 const [statusFilter, setStatusFilter] = useUrlParam('status', { defaultValue: 'active' });
 const [search, setSearch] = useUrlParam('q', { history: 'replace' });
 const [showEnroll, setShowEnroll] = useState(false);
 const [showImport, setShowImport] = useState(false);
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
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                aria-label="Import CSV"
                className="px-3 sm:px-[18px]"
                onClick={() => setShowImport(true)}
              >
                <UploadSimpleIcon weight="bold" size={16} />
                <span className="hidden sm:inline">Import CSV</span>
              </Button>
              <Button onClick={() => setShowEnroll(true)}>
                <PlusIcon weight="bold" size={16} />
                Enroll Student
              </Button>
            </div>
 ) : undefined
 }
 />

 <div className="flex flex-col sm:flex-row gap-3 mb-4">
 <div className="flex gap-1 p-1 bg-secondary rounded-lg">
 {statuses.map(s => (
 <button
 key={s.value}
 onClick={() => setStatusFilter(s.value)}
 className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
 statusFilter === s.value
 ? 'bg-card text-foreground shadow-sm'
 : 'text-muted-foreground hover:text-foreground dark:hover:text-foreground'
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
 className="flex-1 px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
 />
 </div>

 {isLoading ? (
 <TableSkeleton />
 ) : filtered.length === 0 ? (
 <EmptyState
 title="No students found"
 description={statusFilter === STUDENT_STATUS.ACTIVE ? 'No active students. Enroll one using the button above.' : 'No students match this filter.'}
 action={isAdmin ? <Button onClick={() => setShowEnroll(true)}><PlusIcon size={14} weight="bold" />Enroll Student</Button> : undefined}
 />
 ) : (
 <>
 <DataCardList
 items={filtered}
 getKey={(s) => s.id}
 renderCard={(s) => ({
 title: fullName(s.firstName, s.lastName),
 description: toTitleCase(s.guardianName ?? ''),
 badge: <StatusBadge status={s.status} />,
 meta: (
 <>
 <p>{s.level ?? '—'}</p>
 <p className="truncate">
 Teacher: {s.teacherName ? toTitleCase(s.teacherName) : 'Unassigned'}
 </p>
 </>
 ),
 actions: isAdmin ? (
 <div className="flex items-center justify-end gap-2">
 <button
 onClick={() => setAssignTarget(s)}
 title="Assign teacher"
 aria-label="Assign teacher"
 className="p-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-primary transition-colors"
 >
 <ArrowsClockwiseIcon size={18} />
 </button>
 {s.status === STUDENT_STATUS.ACTIVE && (
 <button
 onClick={() => changeStatusMut.mutate({ id: s.id, data: { status: STUDENT_STATUS.INACTIVE } })}
 className="px-3 py-1.5 rounded-md text-xs font-medium text-warn hover:bg-warn-soft dark:hover:bg-amber-950 transition-colors"
 >
 Deactivate
 </button>
 )}
 {s.status === STUDENT_STATUS.INACTIVE && (
 <button
 onClick={() => changeStatusMut.mutate({ id: s.id, data: { status: STUDENT_STATUS.ACTIVE } })}
 className="px-3 py-1.5 rounded-md text-xs font-medium text-status-paid-fg hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
 >
 Activate
 </button>
 )}
 {isSuperadmin && (
 <button
 onClick={() => setDeleteTarget(s)}
 aria-label="Remove student"
 className="p-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-err transition-colors"
 >
 <TrashIcon size={18} />
 </button>
 )}
 </div>
 ) : undefined,
 })}
 />
 <div className="hidden sm:block rounded-xl border border-border overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-border bg-secondary/40">
 <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-12">#</th>
 <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Student</th>
 <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Level</th>
 <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Teacher</th>
 <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
 {isAdmin && <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Actions</th>}
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
 {filtered.map((s, i) => (
 <tr key={s.id}  className="bg-card hover:bg-secondary/40 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs tabular-nums">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{fullName(s.firstName, s.lastName)}</p>
                      <p className="text-xs text-muted-foreground">{toTitleCase(s.guardianName ?? '')}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">
                      {s.level ?? <span className="text-muted-foreground/60">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                      {s.teacherName ? toTitleCase(s.teacherName) : <span className="text-muted-foreground/60">Unassigned</span>}
                    </td>
 <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
 {isAdmin && (
 <td className="px-4 py-3">
 <div className="flex items-center justify-end gap-2">
 <button
 onClick={() => setAssignTarget(s)}
 title="Assign teacher"
 aria-label="Assign teacher"
 className="p-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-primary transition-colors"
 >
 <ArrowsClockwiseIcon size={18} />
 </button>
 {s.status === STUDENT_STATUS.ACTIVE && (
 <button
 onClick={() => changeStatusMut.mutate({ id: s.id, data: { status: STUDENT_STATUS.INACTIVE } })}
 title="Mark inactive"
 className="px-3 py-1.5 rounded-md text-xs font-medium text-warn hover:bg-warn-soft dark:hover:bg-amber-950 transition-colors"
 >
 Deactivate
 </button>
 )}
 {s.status === STUDENT_STATUS.INACTIVE && (
 <button
 onClick={() => changeStatusMut.mutate({ id: s.id, data: { status: STUDENT_STATUS.ACTIVE } })}
 title="Mark active"
 className="px-3 py-1.5 rounded-md text-xs font-medium text-status-paid-fg hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
 >
 Activate
 </button>
 )}
 {isSuperadmin && (
 <button
 onClick={() => setDeleteTarget(s)}
 aria-label="Remove student"
 className="p-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-err transition-colors"
 >
 <TrashIcon size={18} />
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
 </>
 )}

 <EnrollStudentDialog open={showEnroll} onClose={() => setShowEnroll(false)} />
      <StudentImportDialog open={showImport} onClose={() => setShowImport(false)} />
 <AssignTeacherDialog open={!!assignTarget} student={assignTarget} onClose={() => setAssignTarget(null)} />
 <ConfirmDialog
 open={!!deleteTarget}
 title="Remove Student"
 description={`Remove ${fullName(deleteTarget?.firstName, deleteTarget?.lastName)}? All associated payments and periods will be soft-deleted. This cannot be undone.`}
 confirmLabel="Remove"
 confirmVariant="danger"
 onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
 onCancel={() => setDeleteTarget(null)}
 loading={deleteMut.isPending}
 />
 </div>
 );
}
