import { cn } from '@/lib/utils';
import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

// Base classes aligned to the Kumon Iligan design spec:
//, background: card white / dark card surface
//, border: design spec border token
//, focus: primary green ring
//, border-radius: rounded-xl (12px, matching design spec)
const BASE = [
  'w-full px-4 py-3 text-sm bg-card border border-border rounded-xl',
  'text-foreground placeholder:text-muted-foreground',
  'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
  'transition-colors duration-150',
  'dark:bg-card dark:border-border',
].join(' ');

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(BASE, error && 'border-destructive focus:border-destructive focus:ring-destructive/20', className)}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, className, id, children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(BASE, 'cursor-pointer', error && 'border-destructive', className)}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(BASE, 'resize-none', error && 'border-destructive', className)}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
