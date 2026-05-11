import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface WorkspaceLayoutProps {
  list: ReactNode;
  detail: ReactNode;
  listWidth?: number;
  className?: string;
}

// Two-column workspace shell — list on left (fixed width, right border), detail on right (flex).
// Spec: list = 460px, content padded 24px 24px 16px header / 0 16px 24px scroll area.
// Detail panel padding: 24px 32px 36px.
export function WorkspaceLayout({
  list,
  detail,
  listWidth = 460,
  className,
}: WorkspaceLayoutProps) {
  return (
    <div
      className={cn('flex h-full min-h-[720px] -mx-8 -my-6 lg:-mx-[32px] lg:-my-[24px]', className)}
    >
      <div
        className="flex-shrink-0 border-r border-border flex flex-col bg-background hidden md:flex"
        style={{ width: listWidth }}
      >
        {list}
      </div>
      <div className="flex-1 overflow-auto min-w-0">{detail}</div>
    </div>
  );
}
