import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toTitleCase } from '@/utils/text';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPeso(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '\u20B10.00';
  return `\u20B1${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(value?: string | null): string {
  if (!value) return '\u2014';
  const d = new Date(value.includes('T') ? value : value + 'T00:00:00');
  if (isNaN(d.getTime())) return '\u2014';
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatAddress(parts: {
  streetName?: string | null;
  barangay?: string | null;
  city?: string | null;
  province?: string | null;
}): string {
  const { streetName, barangay, city, province } = parts;
  const localPart = [toTitleCase(streetName), toTitleCase(barangay)].filter(Boolean).join(' ');
  return [localPart, toTitleCase(city), toTitleCase(province)].filter(Boolean).join(', ') || '\u2014';
}

export function formatDatetime(value?: string | null): string {
  if (!value) return '\u2014';
  const d = new Date(value);
  return d.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}
