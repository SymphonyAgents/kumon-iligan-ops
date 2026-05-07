'use client';

import * as React from 'react';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { DayPicker, getDefaultClassNames } from 'react-day-picker';
import { cn } from '@/lib/utils';

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaults = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn('p-3', className)}
      classNames={{
        ...defaults,
        months: cn(defaults.months, 'flex flex-col sm:flex-row gap-4'),
        month: cn(defaults.month, 'flex flex-col gap-3'),
        month_caption: cn(defaults.month_caption, 'flex items-center justify-center pt-1 relative h-9'),
        caption_label: cn(defaults.caption_label, 'text-[14px] font-medium text-foreground tracking-[-0.1px]'),
        nav: cn(defaults.nav, 'absolute inset-x-0 top-0 flex items-center justify-between px-1'),
        button_previous: cn(
          defaults.button_previous,
          'inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors',
        ),
        button_next: cn(
          defaults.button_next,
          'inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors',
        ),
        month_grid: cn(defaults.month_grid, 'w-full border-collapse'),
        weekdays: cn(defaults.weekdays, 'flex'),
        weekday: cn(defaults.weekday, 'flex-1 text-muted-foreground text-[11px] font-medium uppercase tracking-[0.1em] py-2'),
        week: cn(defaults.week, 'flex w-full mt-1'),
        day: cn(defaults.day, 'flex-1 aspect-square text-center p-0 relative'),
        day_button: cn(
          defaults.day_button,
          'inline-flex items-center justify-center size-9 rounded-md text-[13px] font-medium hover:bg-secondary transition-colors aria-selected:opacity-100 cursor-pointer',
        ),
        selected: cn(
          defaults.selected,
          '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary/90 [&>button]:focus:bg-primary',
        ),
        today: cn(defaults.today, '[&>button]:border [&>button]:border-primary/40'),
        outside: cn(defaults.outside, 'text-muted-foreground/50 aria-selected:text-muted-foreground'),
        disabled: cn(defaults.disabled, 'text-muted-foreground/30 cursor-not-allowed'),
        hidden: cn(defaults.hidden, 'invisible'),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <CaretLeftIcon size={14} />
          ) : (
            <CaretRightIcon size={14} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
