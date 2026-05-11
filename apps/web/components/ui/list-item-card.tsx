'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface ListItemCardProps {
  active?: boolean;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}

// List item card — used in workspace list columns (My recordings, payments queue, etc.)
// Spec: bg-card, border, radius 10, padding 12px 14px, gap 4 between items.
// Active state: bg-accent-soft, border accent/40.
export function ListItemCard({ active, onClick, className, children }: ListItemCardProps) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'w-full text-left rounded-[10px] border px-[14px] py-3 transition-colors duration-150',
          active
            ? 'bg-accent-soft border-primary/40'
            : 'bg-card border-border hover:bg-secondary/40',
          className,
        )}
      >
        {children}
      </button>
    );
  }
  return (
    <div
      className={cn(
        'rounded-[10px] border px-[14px] py-3',
        active ? 'bg-accent-soft border-primary/40' : 'bg-card border-border',
        className,
      )}
    >
      {children}
    </div>
  );
}
