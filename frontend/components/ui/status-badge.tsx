import { cn } from '@/lib/utils';

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
  overdue: 'Overdue',
  withdrawn: 'Withdrawn',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950',
  inactive: 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-950',
  pending: 'text-zinc-600 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800',
  pending_review: 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-950',
  verified: 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950',
  flagged: 'text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-950',
  rejected: 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-950',
  paid: 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950',
  partial: 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-950',
  overdue: 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-950',
  withdrawn: 'text-zinc-500 bg-zinc-100 dark:text-zinc-400 dark:bg-zinc-800',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        STATUS_COLORS[status] ?? 'text-zinc-500 bg-zinc-100 dark:text-zinc-400 dark:bg-zinc-800',
        className,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
