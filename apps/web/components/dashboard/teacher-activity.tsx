'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Kicker } from '@/components/ui/typography';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuditQuery } from '@/hooks/useAuditQuery';
import { toTitleCase } from '@/utils/text';
import { ArrowRightIcon } from '@phosphor-icons/react';
import type { AuditEntry } from '@/lib/types';
import { cn } from '@/lib/utils';

type Tab = 'team' | 'mine';

const TEACHER_AUDIT_TYPES = new Set([
  'payment_recorded',
  'payment_replied',
]);

const ADMIN_AUDIT_TYPES = new Set([
  'payment_verified',
  'payment_flagged',
  'payment_rejected',
  'student_enrolled',
  'student_status_changed',
  'family_created',
  'family_updated',
  'period_bulk_generated',
]);

const VERB: Record<string, { verb: string; tone: 'paid' | 'warn' | 'err' | 'neutral' }> = {
  payment_recorded:    { verb: 'recorded payment',  tone: 'neutral' },
  payment_verified:    { verb: 'verified',          tone: 'paid' },
  payment_flagged:     { verb: 'flagged',           tone: 'warn' },
  payment_rejected:    { verb: 'rejected',          tone: 'err' },
  payment_replied:     { verb: 'replied on',        tone: 'neutral' },
  student_enrolled:    { verb: 'enrolled',          tone: 'paid' },
  student_status_changed: { verb: 'updated status of', tone: 'neutral' },
  family_created:      { verb: 'added family',      tone: 'paid' },
  family_updated:      { verb: 'updated family',    tone: 'neutral' },
  period_bulk_generated: { verb: 'generated periods', tone: 'neutral' },
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.max(1, Math.floor((now - then) / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function actorInitials(name: string | null, email: string | null): string {
  const source = name ?? email ?? '';
  if (!source) return '·';
  const parts = source.trim().split(/[\s@]+/).filter(Boolean);
  if (parts.length === 0) return source.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function actorFirstName(name: string | null, email: string | null): string {
  if (name) return name.trim().split(/\s+/)[0];
  if (email) return email.split('@')[0];
  return '—';
}

function ActivityRow({ entry }: { entry: AuditEntry }) {
  const meta = entry.auditType ? VERB[entry.auditType] : null;
  const verb = meta?.verb ?? entry.action.replace(/_/g, ' ');
  const tone = meta?.tone ?? 'neutral';
  const target = (entry.details?.paymentNumber as string | undefined)
    ?? (entry.details?.studentName as string | undefined)
    ?? entry.entityType;

  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div className="w-8 h-8 rounded-full bg-accent-soft text-accent-foreground flex items-center justify-center text-[11px] font-semibold shrink-0">
        {actorInitials(entry.performedByFullName, entry.performedByEmail)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] text-foreground tracking-[-0.05px] truncate">
          <span className="font-medium">
            {toTitleCase(actorFirstName(entry.performedByFullName, entry.performedByEmail))}
          </span>{' '}
          <span className="text-muted-foreground">{verb}</span>{' '}
          <span
            className={cn(
              'font-medium',
              tone === 'paid' && 'text-status-paid-fg',
              tone === 'warn' && 'text-warn',
              tone === 'err' && 'text-err',
              tone === 'neutral' && 'text-foreground',
            )}
          >
            {target}
          </span>
        </p>
        {entry.details?.reason ? (
          <p className="text-[12px] text-muted-foreground truncate mt-0.5 italic">
            &ldquo;{String(entry.details.reason)}&rdquo;
          </p>
        ) : null}
      </div>
      <span className="text-[11px] text-muted-foreground/80 shrink-0">{timeAgo(entry.createdAt)}</span>
    </div>
  );
}

interface TeacherActivityProps {
  currentUserId?: string | null;
}

export function TeacherActivity({ currentUserId }: TeacherActivityProps) {
  const [tab, setTab] = useState<Tab>('team');
  const now = new Date();
  const { data: entries = [], isLoading } = useAuditQuery({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    limit: 50,
  });

  const relevant = entries.filter((e) =>
    e.auditType && (TEACHER_AUDIT_TYPES.has(e.auditType) || ADMIN_AUDIT_TYPES.has(e.auditType)),
  );

  const visible =
    tab === 'mine'
      ? relevant.filter((e) => e.performedBy === currentUserId)
      : relevant;

  const trimmed = visible.slice(0, 8);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border gap-3">
        <div>
          <Kicker>Activity</Kicker>
          <p className="text-[15px] font-semibold text-foreground tracking-[-0.1px] mt-0.5">
            Team feed
          </p>
        </div>
        <div className="flex items-center gap-1">
          <div className="inline-flex items-center rounded-[7px] border border-border p-0.5 bg-card">
            {(['team', 'mine'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  'px-2.5 py-1 rounded-[5px] text-[12px] font-medium transition-colors',
                  tab === t
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t === 'team' ? 'Team' : 'Mine'}
              </button>
            ))}
          </div>
          <Link
            href="/audit"
            className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary hover:underline ml-2"
          >
            All
            <ArrowRightIcon size={11} />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-3 flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      ) : trimmed.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-[13px] text-muted-foreground">
            {tab === 'mine' ? 'You haven\'t done anything yet this month.' : 'No team activity this month yet.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {trimmed.map((e) => (
            <ActivityRow key={e.id} entry={e} />
          ))}
        </div>
      )}
    </div>
  );
}
