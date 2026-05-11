'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MembersSection } from './members-section';

interface FamilyMembersDialogProps {
  open: boolean;
  familyId: string | null;
  onClose: () => void;
  /** Pop the inline Add form open when the dialog mounts. */
  openAddOnMount?: boolean;
  title?: string;
}

export function FamilyMembersDialog({
  open,
  familyId,
  onClose,
  openAddOnMount = false,
  title = 'Family members',
}: FamilyMembersDialogProps) {
  return (
    <Dialog
      open={open && !!familyId}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {familyId && (
          <div className="mt-2">
            <MembersSection familyId={familyId} hideHeader openOnMount={openAddOnMount} />
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
