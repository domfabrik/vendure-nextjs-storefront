'use client';

import { useEffect } from 'react';
import { pushEcommerceEvent, reachGoal } from '@/shared/lib';

interface ProductDetailEventProps {
  id: string;
  name: string;
  price: number;
  category?: string;
  variant?: string;
}

export function ProductDetailEvent({ id, name, price, category, variant }: ProductDetailEventProps) {
  useEffect(() => {
    pushEcommerceEvent({
      detail: {
        products: [{ id, name, price: price / 100, category, variant }],
      },
    });
    reachGoal('product_detail');
  }, [id, name, price, category, variant]);

  return null;
}
