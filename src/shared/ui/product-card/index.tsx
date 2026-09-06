'use client';

import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Box, Card, CardContent, IconButton, Typography } from '@mui/material';
import { routes } from '@routes';
import NextLink from 'next/link';
import { normalizeCurrencyCode, normalizeMinorPrice, priceFormatter } from '@/shared/lib';
import type { HomepageProduct, HomepageProductPrice } from '@/shared/model';
import { useCartStore } from '@/shared/store/cart';

function getPrice(price: HomepageProductPrice): number | undefined {
  if (price.__typename === 'SinglePrice') return normalizeMinorPrice(price.value);
  const min = normalizeMinorPrice(price.min);
  const max = normalizeMinorPrice(price.max);
  return min === undefined || max === undefined || min > max ? undefined : min;
}

function formatPrice(price: HomepageProductPrice, currency: 'RUB'): string | undefined {
  if (price.__typename === 'SinglePrice') {
    const value = normalizeMinorPrice(price.value);
    return value === undefined ? undefined : priceFormatter(value, currency);
  }
  const min = normalizeMinorPrice(price.min);
  const max = normalizeMinorPrice(price.max);
  if (min === undefined || max === undefined || min > max) return undefined;
  if (min === max) return priceFormatter(min, currency);
  return `${priceFormatter(min, currency)} – ${priceFormatter(max, currency)}`;
}

function hasDiscount(product: HomepageProduct): boolean {
  return Number.isFinite(product.discountPercent) && product.discountPercent > 0;
}

interface ProductCardProps {
  product: HomepageProduct;
  imgHeight?: string;
}

export function ProductCard({ product, imgHeight }: ProductCardProps) {
  const addToCart = useCartStore((s) => s.addToCart);
  const image = product.productAsset?.preview;
  const href = routes.product(product.slug);
  const currency = normalizeCurrencyCode(product.currencyCode);
  const price = getPrice(product.priceWithTax);
  const formattedPrice = currency ? formatPrice(product.priceWithTax, currency) : undefined;
  const formattedBasePrice = currency ? formatPrice(product.basePriceWithTax, currency) : undefined;
  const showDiscount = hasDiscount(product) && Boolean(formattedBasePrice);

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
        <Box sx={{ overflow: 'hidden' }}>
          <Box
            component="img"
            src={image}
            alt={product.productName}
            sx={{
              display: 'block',
              objectFit: 'contain',
              width: '100%',
              height: imgHeight ?? '210px',
              transition: 'transform .5s',
            }}
          />
        </Box>

        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center', mb: 1 }}>
            <Typography
              variant="body1"
              color="textPrimary"
              sx={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.3 }}
            >
              {formattedPrice ?? 'Цена уточняется'}
            </Typography>
            {showDiscount && formattedBasePrice && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: '12px', textDecoration: 'line-through', lineHeight: 1.2 }}
              >
                {formattedBasePrice}
              </Typography>
            )}
            {showDiscount && (
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
              disabled={price === undefined || !currency || !formattedPrice}
              onClick={(e) => {
                e.preventDefault();
                if (price === undefined || !currency || !formattedPrice) return;
                addToCart({
                  productVariantId: product.productVariantId,
                  productName: product.productName,
                  variantName: product.productName,
                  slug: product.slug,
                  price,
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
