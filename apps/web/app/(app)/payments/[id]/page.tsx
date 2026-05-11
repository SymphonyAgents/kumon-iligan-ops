'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, CheckIcon, FlagIcon, XIcon, TrashIcon } from '@phosphor-icons/react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  usePaymentQuery,
  useVerifyPaymentMutation,
  useFlagPaymentMutation,
  useRejectPaymentMutation,
  useReplyPaymentMutation,
  useDeletePaymentMutation,
} from '@/hooks/usePaymentsQuery';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import { PAYMENT_STATUS, USER_TYPE, MONTHS } from '@/lib/constants';
import { fullName, toTitleCase } from '@/utils/text';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  gcash: 'GCash',
  bank_transfer: 'Bank Transfer',
  cash: 'Cash',
  other: 'Other',
};

function fmtPeso(value: number) {
  return `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;
}

function fmtDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function fmtDateTime(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function relativeTime(value: string | null | undefined) {
  if (!value) return '';
  const diffMs = Date.now() - new Date(value).getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr${hr === 1 ? '' : 's'} ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day} day${day === 1 ? '' : 's'} ago`;
  return fmtDate(value);
}

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  muted?: boolean;
  large?: boolean;
}

function DetailRow({ label, value, mono = false, muted = false, large = false }: DetailRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={
          (large ? 'text-2xl font-semibold tracking-tight ' : 'text-sm font-medium ') +
          (mono ? 'font-mono ' : '') +
          (muted ? 'text-muted-foreground' : 'text-foreground')
        }
      >
        {value}
      </p>
    </div>
  );
}

export default function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const {
    data: payment,
    isLoading,
    isError,
  } = usePaymentQuery(id) as {
    data: any;
    isLoading: boolean;
    isError: boolean;
  };
  const { data: currentUser } = useCurrentUserQuery();
  const isAdmin =
    currentUser?.userType === USER_TYPE.ADMIN || currentUser?.userType === USER_TYPE.SUPERADMIN;
  const isSuperadmin = currentUser?.userType === USER_TYPE.SUPERADMIN;
  const isOwner = currentUser?.id && payment?.recordedBy === currentUser.id;

  const [reply, setReply] = useState('');
  const [showVerify, setShowVerify] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [flagNote, setFlagNote] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  const verifyMut = useVerifyPaymentMutation(() => setShowVerify(false));
  const flagMut = useFlagPaymentMutation(() => {
    setFlagOpen(false);
    setFlagNote('');
  });
  const rejectMut = useRejectPaymentMutation(() => {
    setRejectOpen(false);
    setRejectNote('');
  });
  const replyMut = useReplyPaymentMutation(() => setReply(''));
  const deleteMut = useDeletePaymentMutation(() => {
    setShowDelete(false);
    router.push('/payments');
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link
            href="/payments"
            aria-label="Back to payments"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
          >
            <ArrowLeftIcon size={16} />
          </Link>
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
          <Skeleton className="aspect-[4/5] rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !payment) {
    return (
      <div>
        <PageHeader
          title="Payment not found"
          subtitle="This payment may have been removed or you don't have access."
          backButton={
            <Link href="/payments" className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <ArrowLeftIcon size={18} className="text-muted-foreground" />
            </Link>
          }
        />
      </div>
    );
  }

  const studentName = fullName(payment.student?.firstName, payment.student?.lastName);
  const guardian = payment.family?.guardianName ? toTitleCase(payment.family.guardianName) : '—';
  const periodLabel = payment.period
    ? `${MONTHS[payment.period.periodMonth - 1]} ${payment.period.periodYear}`
    : '—';
  const isFlagged = payment.status === PAYMENT_STATUS.FLAGGED;
  const isPending = payment.status === PAYMENT_STATUS.PENDING_REVIEW;
  const verifierName = payment.verifiedByUser?.fullName
    ? toTitleCase(payment.verifiedByUser.fullName)
    : (payment.verifiedByUser?.email ?? null);
  const verifierInitials = (verifierName ?? 'A')
    .split(' ')
    .map((s: string) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div>
      <PageHeader
        kicker={`${payment.number} · ${payment.status.replace('_', ' ')}`}
        title={studentName || '—'}
        subtitle={`${guardian} · Recorded ${fmtDate(payment.createdAt)}`}
        backButton={
          <Link href="/payments" className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeftIcon size={18} className="text-muted-foreground" />
          </Link>
        }
        action={<StatusBadge status={payment.status} />}
      />

      {/* Flagged callout — admin's note + teacher reply form */}
      {isFlagged && (
        <div className="mb-6 rounded-2xl border border-warn/40 bg-warn-soft px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-accent-soft text-accent-ink flex items-center justify-center text-xs font-semibold">
              {verifierInitials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {verifierName ?? 'Admin'}{' '}
                <span className="text-muted-foreground font-normal">(admin)</span>
              </p>
              <p className="text-xs text-muted-foreground">
                flagged {relativeTime(payment.verifiedAt)}
              </p>
            </div>
          </div>
          {payment.note && (
            <p className="text-sm text-foreground leading-relaxed mb-3">{payment.note}</p>
          )}

          {payment.teacherReply ? (
            <div className="rounded-xl bg-card border border-border px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">
                Your reply · {fmtDateTime(payment.teacherRepliedAt)}
              </p>
              <p className="text-sm text-foreground leading-relaxed">{payment.teacherReply}</p>
            </div>
          ) : isOwner ? (
            <div>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={3}
                placeholder="Reply with context — was this a partial? Did the parent send the rest separately?"
                className="w-full px-3 py-2.5 text-sm bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <div className="flex justify-end gap-2 mt-3">
                <Button
                  onClick={() => replyMut.mutate({ id: payment.id, reply: reply.trim() })}
                  disabled={!reply.trim() || replyMut.isPending}
                >
                  {replyMut.isPending ? 'Sending…' : 'Send reply'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Awaiting reply from{' '}
              {payment.recordedByUser?.fullName
                ? toTitleCase(payment.recordedByUser.fullName)
                : 'recorder'}
              .
            </p>
          )}
        </div>
      )}

      {/* Receipt + Details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        {/* Receipt */}
        <div>
          <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-2">
            Receipt
          </p>
          <div className="aspect-[4/5] max-h-[640px] rounded-2xl border border-border bg-sunken overflow-hidden flex items-center justify-center">
            {payment.receiptImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={payment.receiptImageUrl}
                alt={`Receipt for ${payment.number}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <p className="font-mono text-xs text-muted-foreground">no receipt uploaded</p>
            )}
          </div>
        </div>

        {/* Detail rows */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col gap-3 self-start">
          <DetailRow label="Amount" value={fmtPeso(payment.amount)} large />
          <DetailRow label="Expected" value={fmtPeso(payment.expectedAmountSnapshot)} muted />
          <div className="h-px bg-border my-1" />
          <DetailRow label="Reference" value={payment.referenceNumber ?? '—'} mono />
          <DetailRow
            label="Method"
            value={PAYMENT_METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod}
          />
          <DetailRow label="Date" value={fmtDate(payment.paymentDate)} />
          <DetailRow label="Period" value={periodLabel} />
          <div className="h-px bg-border my-1" />
          {payment.paidByMember && (
            <DetailRow
              label="Paid by"
              value={
                <>
                  {toTitleCase(payment.paidByMember.fullName)}
                  <span className="text-muted-foreground font-normal ml-1.5">
                    ·{' '}
                    {payment.paidByMember.relation.charAt(0).toUpperCase() +
                      payment.paidByMember.relation.slice(1)}
                  </span>
                </>
              }
            />
          )}
          <DetailRow
            label="Recorded by"
            value={
              payment.recordedByUser?.fullName
                ? toTitleCase(payment.recordedByUser.fullName)
                : (payment.recordedByUser?.email ?? '—')
            }
          />
          {payment.verifiedAt && (
            <DetailRow
              label={
                payment.status === PAYMENT_STATUS.VERIFIED
                  ? 'Verified'
                  : payment.status === PAYMENT_STATUS.REJECTED
                    ? 'Rejected'
                    : 'Reviewed'
              }
              value={fmtDateTime(payment.verifiedAt)}
            />
          )}
          {payment.note && payment.status !== PAYMENT_STATUS.FLAGGED && (
            <>
              <div className="h-px bg-border my-1" />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Note</p>
                <p className="text-sm text-foreground leading-relaxed">{payment.note}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action bar (admins only) */}
      {isAdmin && (isPending || isSuperadmin) && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-wrap items-center justify-end gap-2">
          {isPending && (
            <>
              <Button variant="secondary" onClick={() => setRejectOpen(true)}>
                <XIcon size={16} weight="bold" /> Reject
              </Button>
              <Button variant="secondary" onClick={() => setFlagOpen(true)}>
                <FlagIcon size={16} weight="bold" /> Flag
              </Button>
              <Button onClick={() => setShowVerify(true)}>
                <CheckIcon size={16} weight="bold" /> Verify
              </Button>
            </>
          )}
          {isSuperadmin && !isPending && (
            <Button variant="danger" onClick={() => setShowDelete(true)}>
              <TrashIcon size={16} /> Delete
            </Button>
          )}
        </div>
      )}

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={showVerify}
        title="Verify Payment"
        description={`Mark ${payment.number} as verified? This adds ${fmtPeso(payment.amount)} to ${periodLabel}.`}
        confirmLabel="Verify"
        onConfirm={() => verifyMut.mutate({ id: payment.id })}
        onCancel={() => setShowVerify(false)}
        loading={verifyMut.isPending}
      />

      <Dialog
        open={flagOpen}
        onOpenChange={(v) => {
          if (!v) {
            setFlagOpen(false);
            setFlagNote('');
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Flag Payment {payment.number}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-xs font-medium text-foreground">Note (required)</label>
            <textarea
              value={flagNote}
              onChange={(e) => setFlagNote(e.target.value)}
              rows={3}
              placeholder="Describe the issue (amount mismatch, unclear receipt, etc.)…"
              className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setFlagOpen(false);
                setFlagNote('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={!flagNote.trim() || flagMut.isPending}
              onClick={() => flagMut.mutate({ id: payment.id, note: flagNote.trim() })}
            >
              {flagMut.isPending ? 'Saving…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectOpen}
        onOpenChange={(v) => {
          if (!v) {
            setRejectOpen(false);
            setRejectNote('');
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject Payment {payment.number}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-xs font-medium text-foreground">Note (required)</label>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
              placeholder="Reason for rejection (duplicate, fraudulent, wrong student)…"
              className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setRejectOpen(false);
                setRejectNote('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={!rejectNote.trim() || rejectMut.isPending}
              onClick={() => rejectMut.mutate({ id: payment.id, note: rejectNote.trim() })}
            >
              {rejectMut.isPending ? 'Saving…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDelete}
        title="Delete Payment"
        description={`Permanently delete ${payment.number}? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => deleteMut.mutate(payment.id)}
        onCancel={() => setShowDelete(false)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
