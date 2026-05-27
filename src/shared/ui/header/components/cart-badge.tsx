'use client';

import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Badge, IconButton } from '@mui/material';
import { routes } from '@routes';
import NextLink from 'next/link';
import { useCartStore } from '@/shared/store/cart';

export function CartBadge() {
  const totalQuantity = useCartStore((s) => s.totalQuantity);

  return (
    <IconButton
      component={NextLink}
      href={routes.cart()}
      color="inherit"
    >
      <Badge
        badgeContent={totalQuantity}
        color="primary"
      >
        <ShoppingCartIcon />
      </Badge>
    </IconButton>
  );
}
