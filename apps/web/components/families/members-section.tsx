'use client';

import { useState } from 'react';
import { PlusIcon, PencilSimpleIcon, TrashIcon, StarIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toTitleCase } from '@/utils/text';
import {
  useFamilyMembersQuery,
  useCreateFamilyMemberMutation,
  useUpdateFamilyMemberMutation,
  useDeleteFamilyMemberMutation,
} from '@/hooks/useFamilyMembersQuery';
import type { FamilyMember, FamilyMemberRelation } from '@/lib/types';

export const RELATION_OPTIONS: Array<{ value: FamilyMemberRelation; label: string }> = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'grandfather', label: 'Grandfather' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'other', label: 'Other' },
];

export const RELATION_LABEL: Record<FamilyMemberRelation, string> = Object.fromEntries(
  RELATION_OPTIONS.map((o) => [o.value, o.label]),
) as Record<FamilyMemberRelation, string>;

interface MemberDraft {
  fullName: string;
  phone: string;
  email: string;
  relation: FamilyMemberRelation;
  isPrimary: boolean;
}

const BLANK_MEMBER: MemberDraft = {
  fullName: '',
  phone: '',
  email: '',
  relation: 'guardian',
  isPrimary: false,
};

interface MembersSectionProps {
  familyId: string;
  /** Hide the section header. Useful when wrapping in a dialog that already shows a title. */
  hideHeader?: boolean;
  /** Force the inline Add form to be open on mount (e.g. when opened from "+ Add member"). */
  openOnMount?: boolean;
}

export function MembersSection({
  familyId,
  hideHeader = false,
  openOnMount = false,
}: MembersSectionProps) {
  const { data: members = [], isLoading } = useFamilyMembersQuery(familyId);
  const createMut = useCreateFamilyMemberMutation();
  const updateMut = useUpdateFamilyMemberMutation();
  const removeMut = useDeleteFamilyMemberMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MemberDraft>(BLANK_MEMBER);
  const [showForm, setShowForm] = useState(openOnMount);

  function openAdd() {
    setEditingId(null);
    setDraft(BLANK_MEMBER);
    setShowForm(true);
  }

  function openEdit(m: FamilyMember) {
    setEditingId(m.id);
    setDraft({
      fullName: m.fullName,
      phone: m.phone ?? '',
      email: m.email ?? '',
      relation: m.relation,
      isPrimary: m.isPrimary,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setDraft(BLANK_MEMBER);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.fullName.trim()) return;
    const payload = {
      fullName: draft.fullName.trim(),
      phone: draft.phone.trim() || undefined,
      email: draft.email.trim() || undefined,
      relation: draft.relation,
      isPrimary: draft.isPrimary,
    };
    if (editingId) {
      await updateMut.mutateAsync({ familyId, memberId: editingId, data: payload });
    } else {
      await createMut.mutateAsync({ familyId, data: payload });
    }
    closeForm();
  }

  function handleSetPrimary(memberId: string) {
    updateMut.mutate({ familyId, memberId, data: { isPrimary: true } });
  }

  return (
    <div className="flex flex-col gap-2">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground">Members</label>
          {!showForm && (
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-accent-ink transition-colors"
            >
              <PlusIcon size={13} weight="bold" /> Add member
            </button>
          )}
        </div>
      )}

      {hideHeader && !showForm && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-accent-ink transition-colors"
          >
            <PlusIcon size={13} weight="bold" /> Add member
          </button>
        </div>
      )}

      {isLoading && members.length === 0 ? (
        <p className="text-xs text-muted-foreground">Loading members…</p>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
          {members.length === 0 && !showForm && (
            <p className="text-xs text-muted-foreground px-3 py-3">No members yet.</p>
          )}
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-2 px-3 py-2.5">
              {m.isPrimary ? (
                <StarIcon size={14} weight="fill" className="text-warn shrink-0" />
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(m.id)}
                  title="Set as primary contact"
                  className="text-muted-foreground hover:text-warn transition-colors shrink-0"
                >
                  <StarIcon size={14} />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {toTitleCase(m.fullName)}
                  <span className="ml-2 text-[11px] font-normal text-muted-foreground uppercase tracking-wide">
                    {RELATION_LABEL[m.relation]}
                  </span>
                </p>
                <p className="text-[11.5px] text-muted-foreground truncate">
                  {[m.phone, m.email].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openEdit(m)}
                aria-label="Edit member"
                className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <PencilSimpleIcon size={14} />
              </button>
              {!m.isPrimary && (
                <button
                  type="button"
                  onClick={() => removeMut.mutate({ familyId, memberId: m.id })}
                  aria-label="Remove member"
                  className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-err transition-colors"
                >
                  <TrashIcon size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="rounded-xl border border-primary/30 bg-accent-soft/40 p-3 flex flex-col gap-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {editingId ? 'Edit member' : 'Add member'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Full name *"
              value={draft.fullName}
              onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <Select
              value={draft.relation}
              onValueChange={(v) => setDraft({ ...draft, relation: v as FamilyMemberRelation })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={draft.isPrimary}
              onChange={(e) => setDraft({ ...draft, isPrimary: e.target.checked })}
              className="accent-primary"
            />
            Use as primary contact for receipts and dashboards
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeForm}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!draft.fullName.trim() || createMut.isPending || updateMut.isPending}
            >
              {createMut.isPending || updateMut.isPending ? 'Saving…' : editingId ? 'Save' : 'Add'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
