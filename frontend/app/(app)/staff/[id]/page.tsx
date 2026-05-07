'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
 ArrowLeftIcon,
 CheckCircleIcon,
 XCircleIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { toTitleCase } from '@/utils/text';
import { USER_TYPE_STYLES, USER_TYPE_LABELS } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
 useUserQuery,
 useUpdateUserProfileMutation,
 useApproveUserMutation,
 useRejectUserMutation,
} from '@/hooks/useUsersQuery';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import { ROUTES } from '@/lib/routes';
import type { AppUser } from '@/lib/types';


function initials(user: AppUser) {
 const name = user.fullName ?? user.nickname;
 if (name) {
 const parts = name.trim().split(/\s+/);
 if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
 return parts[0].slice(0, 2).toUpperCase();
 }
 return user.email.slice(0, 2).toUpperCase();
}

export default function StaffProfilePage() {
 const params = useParams();
 const router = useRouter();
 const userId = params.id as string;

 const { data: currentUser } = useCurrentUserQuery();
 const isAdmin = currentUser?.userType === 'admin' || currentUser?.userType === 'superadmin';
 const isSuperadmin = currentUser?.userType === 'superadmin';

 const { data: user, isLoading } = useUserQuery(userId);

 const updateMut = useUpdateUserProfileMutation();
 const approveMut = useApproveUserMutation(() => { setApproveOpen(false); router.push('/staff?tab=pending'); });
 const rejectMut = useRejectUserMutation(() => { setRejectOpen(false); router.push('/staff?tab=pending'); });

 const [approveOpen, setApproveOpen] = useState(false);
 const [rejectOpen, setRejectOpen] = useState(false);

 const [form, setForm] = useState({
 fullName: '',
 nickname: '',
 contactNumber: '',
 birthday: '',
 address: '',
 emergencyContactName: '',
 emergencyContactNumber: '',
 });

 const [touched, setTouched] = useState<Partial<Record<keyof typeof form, boolean>>>({});

 const PHONE_RE = /^(09|\+639)\d{9}$/;

 function isValidDate(val: string) {
 if (!val) return true;
 const d = new Date(val);
 if (isNaN(d.getTime())) return false;
 const year = d.getFullYear();
 return year >= 1900 && year <= new Date().getFullYear();
 }

 const errors = {
 contactNumber:
 touched.contactNumber && form.contactNumber && !PHONE_RE.test(form.contactNumber)
 ? 'Enter a valid PH mobile number (e.g. 09XX XXX XXXX)'
 : undefined,
 birthday:
 touched.birthday && !isValidDate(form.birthday)
 ? 'Enter a valid date'
 : undefined,
 };

 const hasErrors = Object.values(errors).some(Boolean);

 function touch(field: keyof typeof form) {
 setTouched((t) => ({ ...t, [field]: true }));
 }

 useEffect(() => {
 if (user) {
 setForm({
 fullName: user.fullName ?? '',
 nickname: user.nickname ?? '',
 contactNumber: user.contactNumber ?? '',
 birthday: user.birthday ?? '',
 address: user.address ?? '',
 emergencyContactName: user.emergencyContactName ?? '',
 emergencyContactNumber: user.emergencyContactNumber ?? '',
 });
 }
 }, [user]);

 function set(field: keyof typeof form, value: string) {
 setForm((f) => ({ ...f, [field]: value }));
 }

 function handleSave() {
 setTouched({ contactNumber: true, birthday: true });
 if (hasErrors) return;
 updateMut.mutate({
 id: userId, data: {
 fullName: form.fullName || undefined,
 nickname: form.nickname || undefined,
 contactNumber: form.contactNumber || undefined,
 birthday: form.birthday || undefined,
 address: form.address || undefined,
 emergencyContactName: form.emergencyContactName || undefined,
 emergencyContactNumber: form.emergencyContactNumber || undefined,
 },
 });
 }

 if (isLoading) {
 return (
 <div className="flex items-center justify-center min-h-64">
 <Spinner size={24} className="text-muted-foreground/60" />
 </div>
 );
 }

 if (!user) {
 return (
 <div className="text-center py-16">
 <p className="text-sm text-muted-foreground">User not found.</p>
 </div>
 );
 }

 const isPendingUser = user?.status === 'pending';

 return (
 <div>
 {/* Approve / Reject confirm dialogs */}
 <ConfirmDialog
 open={approveOpen}
 title="Approve user?"
 description={`Approve ${user?.email ?? 'this user'}? They will be able to sign in and access the system.`}
 confirmLabel="Approve"
 onConfirm={() => approveMut.mutate(userId)}
 onCancel={() => setApproveOpen(false)}
 loading={approveMut.isPending}
 />
 <ConfirmDialog
 open={rejectOpen}
 title="Reject user?"
 description={`Reject ${user?.email ?? 'this user'}? They will not be able to access the system.`}
 confirmLabel="Reject"
 onConfirm={() => rejectMut.mutate(userId)}
 onCancel={() => setRejectOpen(false)}
 loading={rejectMut.isPending}
 />

 {/* Back link */}
 <div className="mb-6">
 <Link
 href={ROUTES.USERS}
 className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors"
 >
 <ArrowLeftIcon size={14} />
 Users
 </Link>
 </div>

 {/* Identity header */}
 <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
 <div className="w-14 h-14 rounded-full bg-secondary dark:bg-card text-white dark:text-foreground flex items-center justify-center text-base font-bold shrink-0 select-none">
 {initials(user)}
 </div>
 <div className="flex-1 min-w-0">
 <h1 className="text-lg font-semibold text-foreground truncate">
 {user.fullName ? (
 <>
 {toTitleCase(user.fullName)}
 {user.nickname && (
 <span className="font-normal text-muted-foreground"> ({toTitleCase(user.nickname)})</span>
 )}
 </>
 ) : user.nickname ? (
 toTitleCase(user.nickname)
 ) : (
 user.email
 )}
 </h1>
 {(() => {
 const meta = [
 user.email,
 user.contactNumber ?? null,
 user.address ? toTitleCase(user.address) : null,
 ].filter(Boolean).join(' | ');
 return meta ? (
 <p className="text-sm text-muted-foreground truncate mt-0.5">{meta}</p>
 ) : null;
 })()}
 </div>
 <span className={cn(
 'shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide',
 USER_TYPE_STYLES[user.userType] ?? 'bg-secondary text-foreground dark:bg-secondary ',
 )}>
 {USER_TYPE_LABELS[user.userType] ?? user.userType}
 </span>
 </div>

 {/* Pending approval action strip */}
 {isPendingUser && isSuperadmin && (
 <div className="mb-6 flex items-center gap-3 p-4 bg-warn-soft dark:bg-amber-950 border border-warn/40 dark:border-amber-800 rounded-lg">
 <div className="flex-1">
 <p className="text-sm font-medium text-amber-800 dark:text-amber-200">This user is pending approval</p>
 <p className="text-xs text-warn mt-0.5">Approve or reject their access to the system.</p>
 </div>
 <div className="flex items-center gap-2">
 <button
 onClick={() => setApproveOpen(true)}
 className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-status-paid-dot hover:bg-emerald-600 rounded-lg transition-colors"
 >
 <CheckCircleIcon size={20} weight="bold" />
 Approve
 </button>
 <button
 onClick={() => setRejectOpen(true)}
 className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-err hover:bg-red-600 rounded-lg transition-colors"
 >
 <XCircleIcon size={20} weight="bold" />
 Reject
 </button>
 </div>
 </div>
 )}

 {/* Profile card */}
 <div className="bg-card border border-border rounded-lg p-5 sm:p-6 space-y-4">
 <h2 className="text-sm font-semibold text-foreground">Profile</h2>
 <Input
 label="Email"
 value={user.email}
 readOnly
 className="bg-secondary/40 text-muted-foreground"
 />
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <Input
 label="Full Name"
 value={form.fullName}
 onChange={(e) => set('fullName', e.target.value)}
 placeholder="Juan dela Cruz"
 readOnly={!isAdmin}
 />
 <Input
 label="Nickname"
 value={form.nickname}
 onChange={(e) => set('nickname', e.target.value)}
 placeholder="Juan"
 readOnly={!isAdmin}
 />
 <Input
 label="Contact Number"
 value={form.contactNumber}
 onChange={(e) => set('contactNumber', e.target.value)}
 onBlur={() => touch('contactNumber')}
 placeholder="09XX XXX XXXX"
 readOnly={!isAdmin}
 error={errors.contactNumber}
 />
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-medium text-muted-foreground tracking-[0.01em]">Birthday</label>
            <DatePicker
              value={form.birthday}
              onChange={(v) => { set('birthday', v); touch('birthday'); }}
              disabled={!isAdmin}
            />
            {errors.birthday && <p className="text-[12.5px] text-err">{errors.birthday}</p>}
          </div>
 </div>
 <Input
 label="Address"
 value={form.address}
 onChange={(e) => set('address', e.target.value)}
 placeholder="Street, Barangay, City"
 readOnly={!isAdmin}
 />
 </div>

 {/* Emergency Contact card */}
 <div className="mt-4 bg-card border border-border rounded-lg p-5 sm:p-6 space-y-4">
 <h2 className="text-sm font-semibold text-foreground">Emergency Contact</h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <Input
 label="Name"
 value={form.emergencyContactName}
 onChange={(e) => set('emergencyContactName', e.target.value)}
 placeholder="Full name"
 readOnly={!isAdmin}
 />
 <Input
 label="Number"
 value={form.emergencyContactNumber}
 onChange={(e) => set('emergencyContactNumber', e.target.value)}
 placeholder="09XX XXX XXXX"
 readOnly={!isAdmin}
 />
 </div>
 </div>

 {/* Single save button for all profile changes */}
 {isAdmin && (
 <div className="flex justify-end mt-4">
 <Button size="sm" disabled={updateMut.isPending} onClick={handleSave}>
 {updateMut.isPending ? <Spinner size={14} /> : 'Save Changes'}
 </Button>
 </div>
 )}
 </div>
 );
}
