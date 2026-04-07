'use client';

import { useRef, useState } from 'react';
import { TrashIcon, ArrowSquareOutIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  useStaffDocumentsQuery,
  useAddDocumentMutation,
  useDeleteDocumentMutation,
} from '@/hooks/useUsersQuery';
import { api } from '@/lib/api';
import { formatDatetime } from '@/lib/utils';
import type { AppUser } from '@/lib/types';


interface StaffDocumentsDialogProps {
  user: AppUser | null;
  onClose: () => void;
}

export function StaffDocumentsDialog({ user, onClose }: StaffDocumentsDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState('');

  const { data: docs = [], isLoading } = useStaffDocumentsQuery(user?.id ?? '');
  const addMut = useAddDocumentMutation(user?.id ?? '');
  const deleteMut = useDeleteDocumentMutation(user?.id ?? '');

  async function handleUpload(file: File) {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'bin';
      const { signedUrl, publicUrl } = await api.expenses.uploadUrl(ext);
      const uploadRes = await fetch(signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!uploadRes.ok) throw new Error('Upload failed');
      await addMut.mutateAsync({ url: publicUrl, label: label.trim() || file.name });
      setLabel('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      console.error(msg);
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    void handleUpload(file);
  }

  return (
    <Dialog open={!!user} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Staff Documents</DialogTitle>
          {user && (
            <p className="text-xs text-zinc-400 mt-0.5">{user.fullName ?? user.email}</p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload section */}
          <div className="rounded-md border border-dashed border-zinc-200 p-4 space-y-3">
            <p className="text-xs font-medium text-zinc-500">Upload document or photo</p>
            <Input
              placeholder="Label (optional — defaults to filename)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="w-full"
            >
              {uploading ? (
                <><Spinner size={14} /> Uploading...</>
              ) : (
                <><UploadSimpleIcon size={14} /> Choose file</>
              )}
            </Button>
          </div>

          {/* Document list */}
          <div className="min-h-[80px]">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Spinner size={20} className="text-zinc-300" />
              </div>
            ) : docs.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-6">No documents uploaded yet.</p>
            ) : (
              <div className="divide-y divide-zinc-100">
                {docs.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-950 truncate">{doc.label ?? 'Untitled'}</p>
                      <p className="text-xs text-zinc-400">{formatDatetime(doc.uploadedAt)}</p>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded transition-colors"
                    >
                      <ArrowSquareOutIcon size={15} />
                    </a>
                    <button
                      onClick={() => deleteMut.mutate(doc.id)}
                      disabled={deleteMut.isPending}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <TrashIcon size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
