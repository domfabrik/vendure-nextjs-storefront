'use client';

import { useEffect } from 'react';
import { pushEcommerceEvent } from '@/shared/lib';

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
  }, [id, name, price, category, variant]);

  return null;
}
