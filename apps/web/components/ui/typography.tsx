import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

// Kicker — uppercase eyebrow. Spec: 11px, weight 600, letter-spacing 1.5, uppercase, text-muted.
export function Kicker({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// DisplayHeading — large display title. Spec: 28-32px, weight 600, negative letter-spacing.
type DisplayHeadingSize = 'sm' | 'md' | 'lg' | 'xl';

interface DisplayHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  size?: DisplayHeadingSize;
  as?: 'h1' | 'h2' | 'h3';
}

const SIZE_CLASSES: Record<DisplayHeadingSize, string> = {
  sm: 'text-[22px] tracking-[-0.3px] leading-[1.1]',
  md: 'text-[28px] tracking-[-0.4px] leading-[1.05]',
  lg: 'text-[30px] tracking-[-0.5px] leading-[1.05]',
  xl: 'text-[32px] tracking-[-0.5px] leading-[1.05]',
};

export function DisplayHeading({
  size = 'md',
  as: Component = 'h1',
  className,
  children,
  ...props
}: DisplayHeadingProps) {
  return (
    <Component
      className={cn('font-semibold text-foreground', SIZE_CLASSES[size], className)}
      {...props}
    >
      {children}
    </Component>
  );
}
