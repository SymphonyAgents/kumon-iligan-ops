import { cn } from '@/lib/utils';

interface ReceiptPlaceholderProps {
  filename: string;
  className?: string;
}

// Diagonal-stripe receipt placeholder. Spec: 4/5 aspect, repeating-linear-gradient sunken/surface.
export function ReceiptPlaceholder({ filename, className }: ReceiptPlaceholderProps) {
  return (
    <div
      className={cn(
        'rounded-[14px] border border-border flex items-center justify-center text-muted-foreground text-xs font-mono',
        className,
      )}
      style={{
        aspectRatio: '4 / 5',
        backgroundImage:
          'repeating-linear-gradient(45deg, var(--color-sunken) 0, var(--color-sunken) 10px, var(--color-surface) 10px, var(--color-surface) 20px)',
      }}
    >
      {filename}
    </div>
  );
}
