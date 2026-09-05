'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { resolveMetrikaConfig } from '@/shared/lib';

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void;
  }
}

export function MetrikaHit() {
  const pathname = usePathname();
  const prevUrl = useRef('');

  useEffect(() => {
    const tagId = resolveMetrikaConfig(window.location.hostname, process.env.NEXT_PUBLIC_METRIKA_ID)?.id;
    const referer = prevUrl.current || document.referrer;
    if (tagId && typeof window.ym === 'function') window.ym(tagId, 'hit', window.location.href, { referer });
    prevUrl.current = window.location.href;
  }, [pathname]);

  return null;
}
