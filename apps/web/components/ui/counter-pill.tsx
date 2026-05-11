import { cn } from '@/lib/utils';

interface CounterPillProps {
  count: number;
  variant?: 'default' | 'active' | 'urgent';
  className?: string;
}

export function CounterPill({ count, variant = 'default', className }: CounterPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full text-[11px] font-medium px-[7px] py-[2px] min-w-[20px] leading-none',
        variant === 'default' && 'bg-secondary text-muted-foreground',
        variant === 'active' && 'bg-primary text-primary-foreground',
        variant === 'urgent' && 'bg-warn text-white',
        className,
      )}
    >
      {count}
    </span>
  );
}
