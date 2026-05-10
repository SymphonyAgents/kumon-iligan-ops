import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
        <div className="w-5 h-5 border-2 border-border-strong rounded-sm" />
      </div>
      <p className="text-[14px] font-medium text-foreground tracking-[-0.1px]">{title}</p>
      {description && (
        <p className="text-[13px] text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
