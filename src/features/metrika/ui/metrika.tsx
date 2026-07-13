'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void;
  }
}

const TAG_ID = 110706774;

export function MetrikaHit() {
  const pathname = usePathname();
  const prevUrl = useRef('');

  useEffect(() => {
    const referer = prevUrl.current || document.referrer;
    window.ym?.(TAG_ID, 'hit', window.location.href, { referer });
    prevUrl.current = window.location.href;
  }, [pathname]);

  return null;
}
