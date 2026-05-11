'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

// Top linear progress bar — no glow, no pulse dot. Bar color = foreground.
export function NavigationProgress() {
  const pathname = usePathname();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPathname = useRef(pathname);
  const tickRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const hideRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function start() {
    clearInterval(tickRef.current);
    clearTimeout(hideRef.current);
    setVisible(true);
    setWidth(10);

    let w = 10;
    tickRef.current = setInterval(() => {
      const remaining = 85 - w;
      w += Math.max(0.5, remaining * 0.08 + Math.random() * 5);
      if (w >= 85) {
        clearInterval(tickRef.current);
        w = 85;
      }
      setWidth(w);
    }, 300);
  }

  function finish() {
    clearInterval(tickRef.current);
    setWidth(100);
    hideRef.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 300);
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto'))
        return;
      if (anchor.getAttribute('target') === '_blank') return;
      start();
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      finish();
    }
  }, [pathname]);

  if (!visible) return null;

  const isFinishing = width === 100;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
      style={{ opacity: isFinishing ? 0 : 1, transition: 'opacity 300ms ease-out' }}
    >
      <div
        className="h-[2px] bg-foreground"
        style={{
          width: `${width}%`,
          transition: isFinishing ? 'width 200ms ease-out' : 'width 300ms ease-out',
        }}
      />
    </div>
  );
}
