'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

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
      w += Math.random() * 12;
      if (w >= 82) {
        clearInterval(tickRef.current);
        w = 82;
      }
      setWidth(w);
    }, 350);
  }

  function finish() {
    clearInterval(tickRef.current);
    setWidth(100);
    hideRef.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 250);
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
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

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none"
      style={{
        width: `${width}%`,
        backgroundColor: '#09090b',
        transition: width === 100 ? 'width 150ms ease-out' : 'width 350ms ease-out',
      }}
    />
  );
}
