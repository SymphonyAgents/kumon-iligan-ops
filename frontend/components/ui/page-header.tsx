import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  backButton?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, backButton, className }: PageHeaderProps) {
  if (backButton) {
    return (
      <div className={cn('flex items-center gap-3 mb-6 md:mb-8', className)}>
        {backButton}
        <div className="flex-1">
          <h1 className="text-lg md:text-xl font-semibold text-zinc-950 tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6 md:mb-8', className)}>
      <div>
        <h1 className="text-lg md:text-xl font-semibold text-zinc-950 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-zinc-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
