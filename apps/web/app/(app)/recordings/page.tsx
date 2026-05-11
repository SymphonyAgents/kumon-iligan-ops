'use client';

import { Suspense, useMemo, useState }, Suspense } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Kicker, DisplayHeading } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/filter-chip';
import { Textarea } from '@/components/ui/input';
import { ListItemCard } from '@/components/ui/list-item-card';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ReceiptPlaceholder } from '@/components/ui/receipt-placeholder';
import { useUrlParam } from '@/hooks/useUrlParam';
import { DRow, DDivider } from '@/components/ui/d-row';
import { StatusBadge } from '@/components/ui/status-badge';
import { Lightbox } from '@/components/ui/lightbox';
import { usePaymentsQuery, useReplyPaymentMutation } from '@/hooks/usePaymentsQuery';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import { PAYMENT_STATUS, PAYMENT_METHOD_LABELS, MONTHS } from '@/lib/constants';
import { fullName, toTitleCase } from '@/utils/text';
import { cn } from '@/lib/utils';
import type { Payment } from '@/lib/types';

type FilterKey = 'all' | 'flagged' | 'pending_review' | 'verified';

const FILTERS: { key: FilterKey; label: string; urgent?: boolean }[] = [
  { key: 'all', label: 'All' },
  { key: 'flagged', label: 'Needs reply', urgent: true },
  { key: 'pending_review', label: 'Pending' },
  { key: 'verified', label: 'Verified' },
];

function fmt(amount: number) {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusToFamily(s: string): string {
  if (s === 'flagged') return 'unpaid';
  if (s === 'verified') return 'paid';
  return 'pending';
}

function RecordingsContent() {
  const { data: currentUser } = useCurrentUserQuery();
  const { data: payments = [], isLoading } = usePaymentsQuery(
    currentUser?.id ? { teacherId: currentUser.id } : undefined,
  );

  const [filterRaw, setFilterRaw] = useUrlParam('filter', { defaultValue: 'all' });
  const filter = filterRaw as FilterKey;
  const setFilter = (v: FilterKey) => setFilterRaw(v);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const counts = useMemo(() => ({
    all: payments.length,
    flagged: payments.filter((p) => p.status === PAYMENT_STATUS.FLAGGED).length,
    pending_review: payments.filter((p) => p.status === PAYMENT_STATUS.PENDING_REVIEW).length,
    verified: payments.filter((p) => p.status === PAYMENT_STATUS.VERIFIED).length,
  }), [payments]);

  const filtered = useMemo(() => {
    if (filter === 'all') return payments;
    return payments.filter((p) => p.status === filter);
  }, [payments, filter]);

  const selected: Payment | undefined = useMemo(
    () => filtered.find((p) => p.id === selectedId) ?? filtered[0],
    [filtered, selectedId],
  );

  const replyMut = useReplyPaymentMutation(() => setReply(''));

  function submitReply() {
    if (!selected || !reply.trim()) return;
    replyMut.mutate({ id: selected.id, reply: reply.trim() });
  }

  return (
    <div className="-mx-5 -mt-5 sm:-mx-8 sm:-mt-6 lg:-mx-8 lg:-mt-6 lg:-mb-9 -mb-9 flex h-[calc(100vh-3.5rem)] lg:h-screen">
      {/* List column */}
      <div className="flex-shrink-0 w-full md:w-[420px] border-r border-border flex flex-col bg-background">
        <div className="px-6 pt-6 pb-3">
          <Kicker className="mb-1.5">My recordings</Kicker>
          <DisplayHeading size="md">What I&apos;ve submitted</DisplayHeading>
          <div className="mt-3 flex gap-1.5 flex-wrap">
            {FILTERS.map((f) => {
              const c =
                f.key === 'all' ? counts.all :
                f.key === 'flagged' ? counts.flagged :
                f.key === 'pending_review' ? counts.pending_review :
                counts.verified;
              return (
                <FilterChip
                  key={f.key}
                  label={f.label}
                  count={c}
                  active={filter === f.key}
                  urgent={f.urgent && c > 0}
                  onClick={() => setFilter(f.key)}
                />
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {isLoading ? (
            <TableSkeleton withCard={false} className="px-2" />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={filter === 'flagged' ? 'No flags awaiting reply' : 'No payments here yet'}
              description={
                filter === 'flagged'
                  ? 'When admin flags one of your recordings, it shows up here.'
                  : 'Record a payment from My Students.'
              }
            />
          ) : (
            <div className="flex flex-col gap-1">
              {filtered.map((p) => {
                const isSel = selected?.id === p.id;
                const isShort = p.amount !== p.expectedAmountSnapshot;
                return (
                  <ListItemCard
                    key={p.id}
                    active={isSel}
                    onClick={() => setSelectedId(p.id)}
                  >
                    <div className="flex items-center justify-between gap-3 min-w-0">
                      <span className="font-medium text-[14px] text-foreground truncate">
                        {fullName(p.studentFirstName, p.studentLastName)}
                      </span>
                      <span
                        className={cn(
                          'text-[14px] tracking-[-0.1px] shrink-0',
                          isShort ? 'text-warn' : 'text-foreground',
                        )}
                      >
                        {fmt(p.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 mt-1 min-w-0">
                      <span className="font-mono text-[12px] text-muted-foreground truncate">
                        {p.number}
                      </span>
                      <StatusBadge
                        status={statusToFamily(p.status)}
                        variant="dot"
                        label={
                          p.status === PAYMENT_STATUS.FLAGGED
                            ? 'Needs reply'
                            : p.status === PAYMENT_STATUS.VERIFIED
                              ? 'Verified'
                              : p.status === PAYMENT_STATUS.PENDING_REVIEW
                                ? 'Pending'
                                : p.status === PAYMENT_STATUS.REJECTED
                                  ? 'Rejected'
                                  : p.status
                        }
                      />
                    </div>
                  </ListItemCard>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail column */}
      <div className="flex-1 overflow-y-auto min-w-0 hidden md:block">
        {selected ? (
          <div className="px-8 pt-6 pb-9">
            <div className="mb-5">
              <Kicker>
                {selected.number} ·{' '}
                {selected.status === PAYMENT_STATUS.FLAGGED
                  ? 'Flagged'
                  : selected.status === PAYMENT_STATUS.VERIFIED
                    ? 'Verified'
                    : selected.status === PAYMENT_STATUS.REJECTED
                      ? 'Rejected'
                      : 'Pending review'}
              </Kicker>
              <DisplayHeading size="lg" className="mt-1.5">
                {fullName(selected.studentFirstName, selected.studentLastName)}
              </DisplayHeading>
              <p className="text-[13px] text-muted-foreground mt-1">
                Recorded {fmtDate(selected.paymentDate)}
                {selected.referenceNumber ? ` · ${selected.referenceNumber}` : ''}
              </p>
            </div>

            {/* Flag thread (cream panel) */}
            {selected.status === PAYMENT_STATUS.FLAGGED && selected.note && (
              <div className="mb-6 rounded-2xl border border-warn/40 bg-warn-soft p-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-full bg-accent-soft text-accent-foreground flex items-center justify-center text-[11px] font-semibold">
                    NQ
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-foreground">Admin flagged this</p>
                    <p className="text-[11.5px] text-muted-foreground">{fmtDate(selected.verifiedAt)}</p>
                  </div>
                </div>
                <p className="text-[13.5px] leading-relaxed mb-3 text-foreground">{selected.note}</p>
                <Textarea
                  placeholder="Reply with context — was this a partial? Did the parent send the rest separately?"
                  rows={3}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <div className="flex justify-end mt-2">
                  <Button onClick={submitReply} disabled={!reply.trim() || replyMut.isPending}>
                    {replyMut.isPending ? 'Sending…' : 'Send reply'}
                  </Button>
                </div>
              </div>
            )}

            {/* Existing reply (if any, shows admin's flag is pending re-review) */}
            {selected.teacherReply && (
              <div className="mb-6 rounded-2xl border border-border bg-card p-4">
                <Kicker className="mb-1.5">Your reply</Kicker>
                <p className="text-[13.5px] leading-relaxed text-foreground">{selected.teacherReply}</p>
                <p className="text-[11.5px] text-muted-foreground mt-2">
                  Sent {fmtDate(selected.teacherRepliedAt)} · re-queued for admin review
                </p>
              </div>
            )}

            {/* Receipt + facts */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
              <div>
                <Kicker className="mb-2">Receipt</Kicker>
                {selected.receiptImageUrl ? (
                  <button
                    type="button"
                    onClick={() => setLightboxSrc(selected.receiptImageUrl)}
                    className="block w-full rounded-2xl overflow-hidden border border-border hover:opacity-90 transition-opacity"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selected.receiptImageUrl}
                      alt="Receipt"
                      className="w-full object-cover"
                    />
                  </button>
                ) : (
                  <ReceiptPlaceholder filename={`receipt-${selected.number}.png`} />
                )}
              </div>
              <div className="flex flex-col gap-2.5">
                <DRow label="Amount" value={fmt(selected.amount)} variant="accent" />
                <DRow label="Expected" value={fmt(selected.expectedAmountSnapshot)} variant="muted" />
                <DDivider />
                <DRow
                  label="Reference"
                  value={selected.referenceNumber ?? '—'}
                  variant={selected.referenceNumber ? 'mono' : 'muted'}
                />
                <DRow label="Method" value={PAYMENT_METHOD_LABELS[selected.paymentMethod] ?? selected.paymentMethod} />
                <DRow label="Date" value={fmtDate(selected.paymentDate)} />
                {selected.guardianName && (
                  <DRow label="Guardian" value={toTitleCase(selected.guardianName)} />
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <Lightbox
        open={!!lightboxSrc}
        src={lightboxSrc ?? ''}
        alt="Receipt"
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
}

export default function RecordingsPage() {
  return (
    <Suspense>
      <RecordingsContent />
    </Suspense>
  );
}
