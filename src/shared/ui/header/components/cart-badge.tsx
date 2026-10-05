'use client';

import { Box, Typography } from '@mui/material';
import { routes } from '@routes';
import NextLink from 'next/link';
import { useCartStore } from '@/shared/store/cart';

export function CartBadge() {
  const totalQuantity = useCartStore((s) => s.totalQuantity);

  return (
    <NextLink
      href={routes.cart()}
      aria-label={`Корзина, ${totalQuantity} товаров`}
      style={{ textDecoration: 'none' }}
    >
      <Box
        sx={(t) => ({
          position: 'relative',
          width: 46,
          height: 46,
          borderRadius: '10px',
          border: `1.5px solid ${t.palette.border.dark}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all .2s',
          '&:hover': {
            borderColor: t.palette.primary.main,
            backgroundColor: 'rgba(27, 43, 69, 0.08)',
          },
        })}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 4h2l2.4 11h10.2L20 8H6.2" />
          <circle
            cx="9"
            cy="19.5"
            r="1.4"
          />
          <circle
            cx="17"
            cy="19.5"
            r="1.4"
          />
        </svg>
        {totalQuantity > 0 && (
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              top: -7,
              right: -7,
              bgcolor: 'accent.main',
              color: 'text.contrast',
              fontWeight: 700,
              minWidth: 20,
              height: 20,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            {totalQuantity}
          </Typography>
        )}
      </Box>
    </NextLink>
  );
}
