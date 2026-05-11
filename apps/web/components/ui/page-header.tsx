import { cn } from '@/lib/utils';
import { Kicker, DisplayHeading } from '@/components/ui/typography';

interface PageHeaderProps {
  title: string;
  kicker?: string;
  subtitle?: string;
  action?: React.ReactNode;
  backButton?: React.ReactNode;
  className?: string;
}

// Spec: 11px UPPERCASE kicker eyebrow + 28-32px display heading + 13px muted subline.
// Header block sits at the top of every page; spec margin-bottom 20-24px.
export function PageHeader({
  title,
  kicker,
  subtitle,
  action,
  backButton,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-5 md:mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {backButton && <div className="shrink-0 pt-1">{backButton}</div>}
        <div className="flex-1 min-w-0">
          {kicker && <Kicker className="mb-1.5">{kicker}</Kicker>}
          <DisplayHeading size="xl" className="md:text-[32px] text-[26px]">
            {title}
          </DisplayHeading>
          {subtitle && <p className="text-[13px] text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
