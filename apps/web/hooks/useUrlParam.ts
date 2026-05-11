'use client';

import { useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface UrlParamOptions {
  /** Value used when the URL has no entry for this key. Also used to strip the key when set back to default. */
  defaultValue?: string;
  /** 'push' creates a new history entry per change (good for tab clicks). 'replace' updates in place (good for search input / continuous filters). */
  history?: 'push' | 'replace';
}

/**
 * Two-way bind a single URL search param to React state.
 * Reads via useSearchParams (auto re-renders on URL change), writes via router.push/replace.
 * Omits the key from the URL when the value equals the default — keeps URLs clean.
 */
export function useUrlParam(key: string, opts: UrlParamOptions = {}) {
  const { defaultValue = '', history = 'push' } = opts;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get(key) ?? defaultValue;

  const setValue = useCallback(
    (next: string) => {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      if (!next || next === defaultValue) {
        params.delete(key);
      } else {
        params.set(key, next);
      }
      const qs = params.toString();
      const url = `${pathname}${qs ? `?${qs}` : ''}`;
      if (history === 'push') {
        router.push(url, { scroll: false });
      } else {
        router.replace(url, { scroll: false });
      }
    },
    [searchParams, pathname, router, key, defaultValue, history],
  );

  return [value, setValue] as const;
}
