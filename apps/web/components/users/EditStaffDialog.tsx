'use client';

import { useState, useEffect } from 'react';
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { useUpdateUserProfileMutation } from '@/hooks/useUsersQuery';
import type { AppUser } from '@/lib/types';

interface EditStaffDialogProps {
 user: AppUser | null;
 onClose: () => void;
}

export function EditStaffDialog({ user, onClose }: EditStaffDialogProps) {
 const updateMut = useUpdateUserProfileMutation(onClose);

 const [form, setForm] = useState({
 fullName: '',
 nickname: '',
 contactNumber: '',
 birthday: '',
 address: '',
 emergencyContactName: '',
 emergencyContactNumber: '',
 });

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
 setForm((prev) => ({ ...prev, [field]: value }));
 }

 function handleSubmit(e: React.FormEvent) {
 e.preventDefault();
 if (!user) return;
 updateMut.mutate({
 id: user.id, data: {
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

 return (
 <Dialog open={!!user} onOpenChange={(open) => { if (!open) onClose(); }}>
 <DialogContent className="max-w-lg">
 <DialogHeader>
 <DialogTitle>Edit Staff Profile</DialogTitle>
 {user && (
 <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
 )}
 </DialogHeader>

 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="grid grid-cols-2 gap-3">
 <Input
 label="Full Name"
 value={form.fullName}
 onChange={(e) => set('fullName', e.target.value)}
 placeholder="Juan dela Cruz"
 />
 <Input
 label="Nickname"
 value={form.nickname}
 onChange={(e) => set('nickname', e.target.value)}
 placeholder="Juan"
 />
 </div>

 <div className="grid grid-cols-2 gap-3">
 <Input
 label="Contact Number"
 value={form.contactNumber}
 onChange={(e) => set('contactNumber', e.target.value)}
 placeholder="09XX XXX XXXX"
 />
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-medium text-muted-foreground tracking-[0.01em]">Birthday</label>
            <DatePicker value={form.birthday} onChange={(v) => set('birthday', v)} />
          </div>
 </div>

 <Input
 label="Address"
 value={form.address}
 onChange={(e) => set('address', e.target.value)}
 placeholder="Street, Barangay, City"
 />

 <div className="pt-1">
 <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
 Emergency Contact
 </p>
 <div className="grid grid-cols-2 gap-3">
 <Input
 label="Name"
 value={form.emergencyContactName}
 onChange={(e) => set('emergencyContactName', e.target.value)}
 placeholder="Full name"
 />
 <Input
 label="Number"
 value={form.emergencyContactNumber}
 onChange={(e) => set('emergencyContactNumber', e.target.value)}
 placeholder="09XX XXX XXXX"
 />
 </div>
 </div>

 <DialogFooter>
 <Button type="button" variant="ghost" onClick={onClose}>
 Cancel
 </Button>
 <Button type="submit" disabled={updateMut.isPending}>
 {updateMut.isPending ? 'Saving...' : 'Save'}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>
 );
}
