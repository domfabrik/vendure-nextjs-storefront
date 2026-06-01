'use client';

import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Box, Card, IconButton, Typography } from '@mui/material';
import { routes } from '@routes';
import NextImage from 'next/image';
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

function hasDiscount(product: HomepageProduct): boolean {
  return product.discountPercent > 0;
}

interface ProductCardProps {
  product: HomepageProduct;
  index: number;
}

export function ProductCard({ product, index }: ProductCardProps) {
  const addToCart = useCartStore((s) => s.addToCart);
  const image = product.productAsset?.preview;
  const name = product.productName;
  const href = routes.product(product.slug);
  const priorityLoading = index < 6;

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
          <Box sx={{ position: 'relative', aspectRatio: '3/4', width: '100%' }}>
            {hasDiscount(product) && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  zIndex: 1,
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 999,
                  bgcolor: '#EF4444',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                -{product.discountPercent}%
              </Box>
            )}
            <NextImage
              src={image}
              alt={name}
              fill
              sizes="(max-width: 600px) 50vw, (max-width: 960px) 33vw, (max-width: 1280px) 25vw, 300px"
              priority={priorityLoading}
              style={{ objectFit: 'contain' }}
            />
          </Box>
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Typography
              variant="body1"
              color="textPrimary"
              sx={{ fontWeight: 700, lineHeight: 1.3 }}
            >
              {formatPrice(product.priceWithTax)}
            </Typography>
            {hasDiscount(product) && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textDecoration: 'line-through', lineHeight: 1.2 }}
              >
                {formatPrice(product.basePriceWithTax)}
              </Typography>
            )}
          </Box>
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
          aria-label="Добавить в корзину"
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
