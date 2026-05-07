import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-secondary', className)}
      {...props}
    />
  );
}

interface TableSkeletonProps {
  className?: string;
  /** Outer rounded card chrome. Set false when caller already wraps in a card. */
  withCard?: boolean;
}

// Spec: 3 thick rows of varying width inside a card. Used as the loading state for
// every data table — keeps Kumon's identity (warm bg, soft sunken bars, rounded-2xl card).
export function TableSkeleton({ className, withCard = true }: TableSkeletonProps) {
  const widths = ['w-full', 'w-[85%]', 'w-[55%]'];
  const bars = (
    <div className="flex flex-col gap-4">
      {widths.map((w, i) => (
        <div key={i} className={cn('h-5 rounded-md bg-secondary animate-pulse', w)} />
      ))}
    </div>
  );

  if (!withCard) return <div className={className}>{bars}</div>;

  return (
    <div className={cn('rounded-2xl border border-border bg-card p-6', className)}>
      {bars}
    </div>
  );
}
