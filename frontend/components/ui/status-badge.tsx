import { cn, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        STATUS_COLORS[status] ?? 'text-zinc-500 bg-zinc-100',
        className,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
