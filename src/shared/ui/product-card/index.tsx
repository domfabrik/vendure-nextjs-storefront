'use client';

import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Box, Card, CardMedia, IconButton, Typography } from '@mui/material';
import { routes } from '@routes';
import NextLink from 'next/link';
import { priceFormatter } from '@/shared/lib';
import type { HomepageProduct, HomepageProductPrice } from '@/shared/model';
import { useCartStore } from '@/shared/store/cart';

function getPrice(price: HomepageProductPrice): number {
  if (price.__typename === 'SinglePrice') return price.value ?? 0;
  return price.min ?? 0;
}

function formatPrice(price: HomepageProductPrice): string {
  if (price.__typename === 'SinglePrice') {
    return priceFormatter(price.value ?? 0);
  }
  const min = price.min ?? 0;
  const max = price.max ?? 0;
  if (min === max) return priceFormatter(min);
  return `${priceFormatter(min)} – ${priceFormatter(max)}`;
}

interface ProductCardProps {
  product: HomepageProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCartStore((s) => s.addToCart);
  const image = product.productAsset?.preview;
  const name = product.productName;
  const href = routes.product(product.slug);

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <NextLink href={href}>
        {image ? (
          <CardMedia
            component="img"
            image={image}
            alt={name}
            sx={{ aspectRatio: '3/4', objectFit: 'contain' }}
          />
        ) : (
          <Box
            sx={{
              aspectRatio: '3/4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="body2"
              color="text.disabled"
            >
              Нет фото
            </Typography>
          </Box>
        )}
        <Box sx={{ p: 1 }}>
          <Typography
            variant="body1"
            color="textPrimary"
            sx={{ fontWeight: 700, lineHeight: 1.3 }}
          >
            {formatPrice(product.priceWithTax)}
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{
              mt: 0.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.3,
              minHeight: '2.6em',
            }}
          >
            {name}
          </Typography>
        </Box>
      </NextLink>
      <Box sx={{ px: 1, pb: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <IconButton
          size="small"
          color="primary"
          onClick={(e) => {
            e.preventDefault();
            addToCart({
              productVariantId: product.productVariantId,
              productName: product.productName,
              variantName: product.productName,
              slug: product.slug,
              price: getPrice(product.priceWithTax),
              image: product.productAsset?.preview ?? null,
            });
          }}
        >
          <ShoppingCartIcon fontSize="small" />
        </IconButton>
      </Box>
    </Card>
  );
}
