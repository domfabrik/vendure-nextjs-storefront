'use client';

import { useEffect } from 'react';
import { useCartStore } from './cart';

export function CartHydration() {
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  return null;
}
