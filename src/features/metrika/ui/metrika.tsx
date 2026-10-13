'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { resolveMetrikaConfig, sanitizeMetrikaUrl } from '@/shared/lib';

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void;
  }
}

export function MetrikaHit() {
  const pathname = usePathname();
  const prevUrl = useRef('');
  const pausedForReview = useRef(false);

  useEffect(() => {
    const tagId = resolveMetrikaConfig(window.location.hostname, process.env.NEXT_PUBLIC_METRIKA_ID)?.id;
    if (pathname === '/description-review') {
      if (tagId && typeof window.ym === 'function' && !pausedForReview.current) {
        window.ym(tagId, 'destruct');
        pausedForReview.current = true;
      }
      prevUrl.current = '';
      return;
    }
    if (pausedForReview.current && tagId && typeof window.ym === 'function') {
      window.ym(tagId, 'init', { defer: true, webvisor: true, clickmap: true, ecommerce: 'dataLayer', accurateTrackBounce: true, trackLinks: true });
      pausedForReview.current = false;
    }
    const referer = sanitizeMetrikaUrl(prevUrl.current || document.referrer);
    const url = sanitizeMetrikaUrl(window.location.href);
    if (tagId && typeof window.ym === 'function') window.ym(tagId, 'hit', url, { referer });
    prevUrl.current = url;
  }, [pathname]);

  return null;
}
