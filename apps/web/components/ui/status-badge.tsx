import { cn } from '@/lib/utils';

export type StatusFamily = 'paid' | 'partial' | 'unpaid' | 'pending';
export type StatusVariant = 'dot' | 'pill' | 'bar';

const FAMILY_STYLES: Record<StatusFamily, { dot: string; bg: string; fg: string }> = {
 paid: { dot: 'bg-status-paid-dot', bg: 'bg-status-paid-bg', fg: 'text-status-paid-fg' },
 partial: { dot: 'bg-status-partial-dot', bg: 'bg-status-partial-bg', fg: 'text-status-partial-fg' },
 unpaid: { dot: 'bg-status-unpaid-dot', bg: 'bg-status-unpaid-bg', fg: 'text-status-unpaid-fg' },
 pending: { dot: 'bg-status-pending-dot', bg: 'bg-status-pending-bg', fg: 'text-status-pending-fg' },
};

// Domain status keys collapse onto the four spec families.
const DOMAIN_TO_FAMILY: Record<string, StatusFamily> = {
 active: 'paid',
 verified: 'paid',
 paid: 'paid',
 inactive: 'partial',
 partial: 'partial',
 pending_review: 'partial',
 flagged: 'partial',
 unpaid: 'unpaid',
 overdue: 'unpaid',
 rejected: 'unpaid',
 pending: 'pending',
 withdrawn: 'pending',
};

const STATUS_LABELS: Record<string, string> = {
 active: 'Active',
 inactive: 'Inactive',
 pending: 'Pending',
 pending_review: 'Pending Review',
 verified: 'Verified',
 flagged: 'Flagged',
 rejected: 'Rejected',
 paid: 'Paid',
 partial: 'Partial',
 unpaid: 'Unpaid',
 overdue: 'Overdue',
 withdrawn: 'Withdrawn',
};

interface StatusBadgeProps {
 status: string;
 variant?: StatusVariant;
 size?: 'sm' | 'md';
 label?: string;
 className?: string;
}

export function StatusBadge({
 status,
 variant = 'pill',
 size = 'sm',
 label,
 className,
}: StatusBadgeProps) {
 const family = DOMAIN_TO_FAMILY[status] ?? 'pending';
 const s = FAMILY_STYLES[family];
 const text = label ?? STATUS_LABELS[status] ?? status;

 if (variant === 'dot') {
 return (
 <span className={cn('inline-flex items-center gap-2', className)}>
 <span className={cn('w-2 h-2 rounded-full shrink-0', s.dot)} />
 <span className={cn('text-muted-foreground', size === 'sm' ? 'text-[13px]' : 'text-sm')}>
 {text}
 </span>
 </span>
 );
 }

 if (variant === 'bar') {
 return (
 <span className={cn('inline-flex items-center gap-2.5', className)}>
 <span className={cn('w-[3px] h-4 rounded-sm shrink-0', s.dot)} />
 <span className={cn('font-medium text-foreground', size === 'sm' ? 'text-[13px]' : 'text-sm')}>
 {text}
 </span>
 </span>
 );
 }

 return (
 <span
 className={cn(
 'inline-flex items-center gap-1.5 rounded-full font-medium',
 size === 'sm' ? 'text-xs px-[9px] py-[3px]' : 'text-[13px] px-[11px] py-[5px]',
 s.bg,
 s.fg,
 className,
 )}
 >
 <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
 {text}
 </span>
 );
}
