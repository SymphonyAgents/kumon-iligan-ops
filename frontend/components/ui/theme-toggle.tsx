'use client';
import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className={cn(
        'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-sm transition-colors duration-150',
        'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100',
        'dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800',
        className,
      )}
    >
      {resolvedTheme === 'dark' ? <SunIcon size={16} /> : <MoonIcon size={16} />}
      {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
    </button>
  );
}
