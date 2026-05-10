'use client';

import { useState, type ReactNode } from 'react';
import { CaretUpDownIcon, CheckIcon, XIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';

export interface MultiComboboxOption {
  value: string;
  label: string;
  description?: string;
  keywords?: string;
  leading?: ReactNode;
  disabled?: boolean;
}

interface MultiComboboxProps {
  options: MultiComboboxOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  /** Maximum number of chips shown inline before collapsing to "+N more". */
  maxInlineChips?: number;
}

export function MultiCombobox({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No matches.',
  disabled,
  className,
  maxInlineChips = 4,
}: MultiComboboxProps) {
  const [open, setOpen] = useState(false);
  const selectedSet = new Set(value);
  const selectedOptions = options.filter((o) => selectedSet.has(o.value));
  const visible = selectedOptions.slice(0, maxInlineChips);
  const overflow = selectedOptions.length - visible.length;

  function toggle(v: string) {
    if (selectedSet.has(v)) {
      onChange(value.filter((x) => x !== v));
    } else {
      onChange([...value, v]);
    }
  }

  function removeChip(e: React.MouseEvent, v: string) {
    e.stopPropagation();
    onChange(value.filter((x) => x !== v));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'inline-flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-[14px] text-foreground transition-colors duration-150 min-h-[48px]',
            'hover:border-border-strong focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          )}
        >
          <span className="flex flex-1 flex-wrap items-center gap-1.5 min-w-0 text-left">
            {selectedOptions.length === 0 && (
              <span className="text-muted-foreground/70 text-[14px] py-0.5">{placeholder}</span>
            )}
            {visible.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[12.5px] font-medium text-foreground"
              >
                <span className="truncate max-w-[140px]">{opt.label}</span>
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`Remove ${opt.label}`}
                  onClick={(e) => removeChip(e, opt.value)}
                  className="inline-flex items-center justify-center rounded hover:text-err"
                >
                  <XIcon size={11} />
                </span>
              </span>
            ))}
            {overflow > 0 && (
              <span className="text-[12.5px] text-muted-foreground py-0.5">
                +{overflow} more
              </span>
            )}
          </span>
          <CaretUpDownIcon size={14} className="shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[280px]"
      >
        <Command
          filter={(itemValue, search) => {
            const opt = options.find((o) => o.value === itemValue);
            if (!opt) return 0;
            const haystack = `${opt.label} ${opt.description ?? ''} ${opt.keywords ?? ''}`.toLowerCase();
            return haystack.includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isSelected = selectedSet.has(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    onSelect={() => toggle(opt.value)}
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded border shrink-0',
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border-strong',
                      )}
                    >
                      {isSelected && <CheckIcon size={11} weight="bold" />}
                    </span>
                    {opt.leading}
                    <span className="flex-1 truncate">
                      <span className="block truncate">{opt.label}</span>
                      {opt.description && (
                        <span className="block truncate text-[12px] text-muted-foreground">
                          {opt.description}
                        </span>
                      )}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
