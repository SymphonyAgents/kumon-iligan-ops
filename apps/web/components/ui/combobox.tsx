'use client';

import { useState, type ReactNode } from 'react';
import { CaretUpDownIcon, CheckIcon } from '@phosphor-icons/react';
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

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  // Optional searchable text beyond label (e.g. phone number, email)
  keywords?: string;
  // Optional left-side adornment (avatar, icon, dot)
  leading?: ReactNode;
  disabled?: boolean;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  /** Display the option's leading + label inside the trigger when selected. Defaults to true. */
  showLeading?: boolean;
}

// Combobox — popover with searchable command list. Use for selects with many options
// (10+ items, lookups for students/families/users/etc.). For ≤ ~10 fixed options
// (status, role, role-types) prefer the plain Select primitive.
export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No matches.',
  disabled,
  className,
  showLeading = true,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'inline-flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-[14px] text-foreground transition-colors duration-150',
            'hover:border-border-strong focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed',
            !selected && 'text-muted-foreground/70',
            className,
          )}
        >
          <span className="flex items-center gap-2 min-w-0 truncate">
            {showLeading && selected?.leading}
            <span className="truncate">{selected?.label ?? placeholder}</span>
          </span>
          <CaretUpDownIcon size={14} className="shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[260px]"
      >
        <Command
          filter={(itemValue, search) => {
            // itemValue here is the option.value; we want to match against label + keywords.
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
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  onSelect={(v) => {
                    onChange(v);
                    setOpen(false);
                  }}
                >
                  {opt.leading}
                  <span className="flex-1 truncate">
                    <span className="block truncate">{opt.label}</span>
                    {opt.description && (
                      <span className="block truncate text-[12px] text-muted-foreground">
                        {opt.description}
                      </span>
                    )}
                  </span>
                  {value === opt.value && (
                    <CheckIcon size={14} className="text-primary shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
