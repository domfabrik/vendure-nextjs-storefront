'use client';

import { Box, Typography } from '@mui/material';
import { routes } from '@routes';
import NextLink from 'next/link';
import { normalizeCurrencyCode, normalizeMinorPrice, priceFormatter } from '@/shared/lib';
import type { HomepageProduct } from '@/shared/model';
import { useCartStore } from '@/shared/store/cart';

interface ProductCardProps {
  product: HomepageProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCartStore((s) => s.addToCart);
  const offer = product.chosenOffer;
  const image = offer?.productAsset?.preview ?? product.productAsset?.preview;
  const href = routes.product(product.slug, offer?.productVariantId);
  const currency = normalizeCurrencyCode(offer?.currencyCode);
  const price = normalizeMinorPrice(offer?.priceWithTax);
  const formattedPrice = price !== undefined && currency ? priceFormatter(price, currency) : undefined;
  const basePrice = normalizeMinorPrice(offer?.basePriceWithTax);
  const formattedBasePrice = basePrice !== undefined && currency ? priceFormatter(basePrice, currency) : undefined;
  const showDiscount = Boolean(offer && Number.isFinite(offer.discountPercent) && offer.discountPercent > 0 && formattedBasePrice);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #E6E2DB',
        borderRadius: '16px',
        overflow: 'hidden',
        bgcolor: '#FFFFFF',
        '&:hover img': {
          transform: 'scale(1.05)',
        },
      }}
    >
      <NextLink
        href={href}
        style={{ textDecoration: 'none' }}
      >
        <Box
          sx={{
            position: 'relative',
            aspectRatio: '4 / 3',
            bgcolor: '#F3F1EE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            overflow: 'hidden',
          }}
        >
          <img
            src={image}
            alt={product.productName}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              transition: 'transform .5s',
            }}
          />
          {showDiscount && (
            <Typography
              sx={{
                position: 'absolute',
                top: 12,
                left: 12,
                bgcolor: '#FFFFFF',
                color: '#96592C',
                fontSize: 12,
                fontWeight: 700,
                px: 1.25,
                py: 0.625,
                borderRadius: '6px',
              }}
            >
              -{offer?.discountPercent}%
            </Typography>
          )}
        </Box>
      </NextLink>

      <Box sx={{ p: 2.25, pb: 2.5, display: 'flex', flexDirection: 'column', gap: 1.25, flexGrow: 1 }}>
        <NextLink
          href={href}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 600, lineHeight: 1.35, color: '#1B2B45' }}>{product.productName}</Typography>
        </NextLink>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.25, mt: 'auto' }}>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#1B2B45' }}>{formattedPrice ?? 'Цена уточняется'}</Typography>
          {showDiscount && formattedBasePrice && <Typography sx={{ fontSize: 14, color: '#6B7586', textDecoration: 'line-through' }}>{formattedBasePrice}</Typography>}
        </Box>

        <button
          type="button"
          disabled={price === undefined || !currency || !formattedPrice || !offer}
          onClick={() => {
            if (price === undefined || !currency || !formattedPrice || !offer) return;
            addToCart({
              productVariantId: offer.productVariantId,
              productName: product.productName,
              variantName: product.productName,
              slug: product.slug,
              price,
              image: image ?? null,
            });
          }}
          style={{
            height: 46,
            borderRadius: 10,
            border: '1.5px solid #1B2B45',
            background: '#FFFFFF',
            color: '#1B2B45',
            fontFamily: 'inherit',
            fontWeight: 700,
            fontSize: 15,
            cursor: price !== undefined ? 'pointer' : 'default',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all .2s',
            padding: 0,
          }}
        >
          В корзину
        </button>
      </Box>
    </Box>
  );
}
