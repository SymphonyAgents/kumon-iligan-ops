'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DataCardProps {
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  note?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DataCard({
  title,
  description,
  badge,
  meta,
  trailing,
  note,
  actions,
  onClick,
  className,
}: DataCardProps) {
  const interactive = Boolean(onClick);
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-foreground truncate">{title}</div>
          {description && (
            <div className="text-xs text-muted-foreground truncate mt-0.5">{description}</div>
          )}
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>
      {(meta || trailing) && (
        <div className="flex items-end justify-between gap-3">
          {meta && (
            <div className="text-xs text-muted-foreground space-y-0.5 min-w-0 flex-1">{meta}</div>
          )}
          {trailing && (
            <div className="text-base font-semibold text-foreground whitespace-nowrap">
              {trailing}
            </div>
          )}
        </div>
      )}
      {note && (
        <div className="text-xs text-muted-foreground bg-secondary/40 rounded-md px-2.5 py-1.5">
          {note}
        </div>
      )}
      {actions && <div className="pt-2 border-t border-border">{actions}</div>}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'w-full p-4 flex flex-col gap-3 text-left active:bg-secondary/40 transition-colors',
          className,
        )}
      >
        {content}
      </button>
    );
  }
  return <div className={cn('p-4 flex flex-col gap-3', className)}>{content}</div>;
}

export interface DataCardListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderCard: (item: T) => DataCardProps;
  className?: string;
  alwaysShow?: boolean;
}

export function DataCardList<T>({
  items,
  getKey,
  renderCard,
  className,
  alwaysShow = false,
}: DataCardListProps<T>) {
  if (items.length === 0) return null;
  return (
    <div
      className={cn(
        alwaysShow ? '' : 'sm:hidden',
        'rounded-xl border border-border overflow-hidden divide-y divide-border bg-card',
        className,
      )}
    >
      {items.map((item) => (
        <DataCard key={getKey(item)} {...renderCard(item)} />
      ))}
    </div>
  );
}
