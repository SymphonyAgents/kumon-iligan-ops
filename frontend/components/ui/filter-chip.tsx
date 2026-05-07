'use client';

import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

interface FilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
 label: string;
 count?: number;
 active?: boolean;
 urgent?: boolean;
}

// Filter chip — pill-style toggle (e.g. All / Pending / Verified row above lists).
// Spec: 12.5px text, 6px 11px padding, radius 7, count number with opacity 0.6.
export function FilterChip({
 label,
 count,
 active,
 urgent,
 className,
 ...props
}: FilterChipProps) {
 return (
 <button
 type="button"
 className={cn(
 'inline-flex items-center gap-1 rounded-[7px] px-[11px] py-[6px] text-[12.5px] font-medium transition-colors duration-150',
 active
 ? 'bg-foreground text-background'
 : urgent
 ? 'border border-warn/40 text-warn bg-transparent hover:bg-warn-soft'
 : 'border border-border text-muted-foreground bg-transparent hover:bg-secondary',
 className,
 )}
 {...props}
 >
 <span>{label}</span>
      {count !== undefined && <span className="opacity-60 ml-0.5">{count}</span>}
 </button>
 );
}
