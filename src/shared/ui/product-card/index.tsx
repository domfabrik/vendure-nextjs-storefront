'use client';

import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Box, Card, CardContent, IconButton, Typography } from '@mui/material';
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

function hasDiscount(product: HomepageProduct): boolean {
  return product.discountPercent > 0;
}

interface ProductCardProps {
  product: HomepageProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCartStore((s) => s.addToCart);
  const image = product.productAsset?.preview;
  const href = routes.product(product.slug);

  return (
    <NextLink href={href}>
      <Card
        elevation={3}
        sx={{
          position: 'relative',
          textAlign: 'center',
          borderRadius: 2,
          '&:hover': {
            img: {
              transform: 'scale(1.1)',
            },
          },
        }}
      >
        <Box
          component="img"
          src={image}
          alt={product.productName}
          sx={{
            position: 'relative',
            objectFit: 'contain',
            width: '100%',
            height: '210px',
            transition: 'transform .5s',
            mb: 2,
          }}
        />

        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center', mb: 2 }}>
            <Typography
              variant="body1"
              color="textPrimary"
              sx={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.3 }}
            >
              {formatPrice(product.priceWithTax)}
            </Typography>
            {hasDiscount(product) && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: '12px', textDecoration: 'line-through', lineHeight: 1.2 }}
              >
                {formatPrice(product.basePriceWithTax)}
              </Typography>
            )}
            {hasDiscount(product) && (
              <Typography
                variant="body2"
                sx={{
                  p: 1,
                  bgcolor: 'rgb(255, 111, 97)',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 300,
                  lineHeight: 1,
                }}
              >
                -{product.discountPercent}%
              </Typography>
            )}
          </Box>

          <Typography
            variant="body2"
            color="textSecondary"
            sx={{
              width: 'calc(100% - 32px)',
              height: '42px',
              textAlign: 'start',
            }}
          >
            {product.productName}
          </Typography>

          <Box sx={{ position: 'absolute', bottom: 8, right: 8 }}>
            <IconButton
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
        </CardContent>
      </Card>
    </NextLink>
  );
}
