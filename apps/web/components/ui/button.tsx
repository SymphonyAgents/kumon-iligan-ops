import { cn } from '@/lib/utils';
import { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
  size?: 'sm' | 'md';
  full?: boolean;
}

// Spec: 15px text, 12px 18px padding, radius 12, weight 500, letter-spacing -0.1.
// Variants: primary (accent), secondary (outline), ghost (text-muted), danger (err border), dark (foreground).
export function Button({
  variant = 'primary',
  size = 'md',
  full = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-xl font-medium tracking-[-0.1px] transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.985]',
        size === 'sm' && 'px-3 py-1.5 text-[13px]',
        size === 'md' && 'px-[18px] py-3 text-[15px]',
        full && 'w-full',
        variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90',
        variant === 'secondary' &&
          'bg-transparent text-foreground border border-border-strong hover:bg-secondary',
        variant === 'ghost' &&
          'bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary',
        variant === 'danger' && 'bg-transparent text-err border border-err hover:bg-err/10',
        variant === 'dark' && 'bg-foreground text-background hover:opacity-90',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
