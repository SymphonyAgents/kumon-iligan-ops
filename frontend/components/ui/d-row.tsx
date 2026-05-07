import { cn } from '@/lib/utils';

interface DRowProps {
 label: string;
 value: React.ReactNode;
 variant?: 'default' | 'accent' | 'muted' | 'mono';
 className?: string;
}

// Detail row — used in side panels for label/value pairs (e.g. payment receipt summary).
// Spec: 12.5px label, 14px value (22px display + tracking on `accent`), baseline-aligned.
export function DRow({ label, value, variant = 'default', className }: DRowProps) {
 return (
 <div className={cn('flex items-baseline justify-between gap-4', className)}>
 <span text-[12.5px] font-medium text-muted-foreground>{label}</span>
 <span
 className={cn(
 variant === 'accent' && 'text-[22px] font-semibold tracking-[-0.3px] text-foreground',
 variant === 'muted' && 'text-sm font-medium text-muted-foreground',
 variant === 'mono' && 'text-sm font-medium font-mono text-foreground',
 variant === 'default' && 'text-sm font-medium text-foreground',
 )}
 >
 {value}
 </span>
 </div>
 );
}

interface DDividerProps {
 className?: string;
}

export function DDivider({ className }: DDividerProps) {
 return <div className={cn('h-px bg-border my-1', className)} />;
}
