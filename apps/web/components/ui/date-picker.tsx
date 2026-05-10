'use client';

import { useState } from 'react';
import { format, parse, isValid } from 'date-fns';
import { CalendarBlankIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

interface DatePickerProps {
  // ISO `YYYY-MM-DD` string. Empty string for unset.
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  className?: string;
}

const DISPLAY_FMT = 'MMM d, yyyy';

function parseISO(s?: string): Date | undefined {
  if (!s) return undefined;
  const d = parse(s, 'yyyy-MM-dd', new Date());
  return isValid(d) ? d : undefined;
}

function toISO(d?: Date): string {
  if (!d) return '';
  return format(d, 'yyyy-MM-dd');
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled,
  min,
  max,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseISO(value);
  const minDate = parseISO(min);
  const maxDate = parseISO(max);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'inline-flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-[14px] text-foreground transition-colors duration-150',
            'hover:border-border-strong focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed',
            !selected && 'text-muted-foreground/70',
            className,
          )}
        >
          <span className="truncate">
            {selected ? format(selected, DISPLAY_FMT) : placeholder}
          </span>
          <CalendarBlankIcon size={14} className="shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            onChange(toISO(d));
            setOpen(false);
          }}
          defaultMonth={selected}
          disabled={
            minDate || maxDate
              ? (date) => {
                  if (minDate && date < minDate) return true;
                  if (maxDate && date > maxDate) return true;
                  return false;
                }
              : undefined
          }
        />
      </PopoverContent>
    </Popover>
  );
}
