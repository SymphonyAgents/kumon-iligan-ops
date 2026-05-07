import { cn } from '@/lib/utils';
import { type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

// Spec: 16px input text, 14px 16px padding, radius 12, focus border = primary accent.
const BASE = [
 'w-full px-4 py-3.5 text-base bg-card border border-border rounded-xl',
 'text-foreground placeholder:text-muted-foreground/70',
 'focus:outline-none focus:border-primary',
 'transition-colors duration-150',
].join(' ');

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
 label?: string;
 error?: string;
 hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
 return (
 <div className="flex flex-col gap-2">
 {label && (
 <label
 htmlFor={id}
 className="text-[13px] font-medium text-muted-foreground tracking-[0.01em]"
 >
 {label}
 </label>
 )}
 <input
 id={id}
 className={cn(
 BASE,
 error && 'border-destructive focus:border-destructive',
 className,
 )}
 {...props}
 />
 {error && <p className="text-[12.5px] text-err">{error}</p>}
 {!error && hint && <p className="text-xs text-muted-foreground/80">{hint}</p>}
 </div>
 );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
 label?: string;
 error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
 return (
 <div className="flex flex-col gap-2">
 {label && (
 <label htmlFor={id} className="text-[13px] font-medium text-muted-foreground tracking-[0.01em]" >
 {label}
 </label>
 )}
 <textarea
 id={id}
 className={cn(BASE, 'resize-none', error && 'border-destructive', className)}
 {...props}
 />
 {error && <p className="text-[12.5px] text-err">{error}</p>}
 </div>
 );
}
