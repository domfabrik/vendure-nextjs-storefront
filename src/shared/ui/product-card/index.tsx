'use client';

import { Box, Button, Typography } from '@mui/material';
import { routes } from '@routes';
import NextLink from 'next/link';
import { priceFormatter, resolveCatalogPriceState } from '@/shared/lib';
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
  const priceState = resolveCatalogPriceState(product.priceNotSpecified, offer?.priceWithTax, offer?.currencyCode);
  const formattedPrice = priceState.kind === 'priced' ? priceFormatter(priceState.price, priceState.currency) : undefined;
  const basePriceState = resolveCatalogPriceState(product.priceNotSpecified, offer?.basePriceWithTax, offer?.currencyCode);
  const formattedBasePrice = basePriceState.kind === 'priced' ? priceFormatter(basePriceState.price, basePriceState.currency) : undefined;
  const showDiscount = Boolean(priceState.kind === 'priced' && offer && Number.isFinite(offer.discountPercent) && offer.discountPercent > 0 && formattedBasePrice);

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
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#1B2B45' }}>
            {priceState.kind === 'not-specified' ? 'Цена не указана' : (formattedPrice ?? 'Цена уточняется')}
          </Typography>
          {showDiscount && formattedBasePrice && <Typography sx={{ fontSize: 14, color: '#6B7586', textDecoration: 'line-through' }}>{formattedBasePrice}</Typography>}
        </Box>

        {priceState.kind !== 'not-specified' && (
          <Button
            variant="outlined"
            fullWidth
            disabled={priceState.kind !== 'priced' || !formattedPrice || !offer}
            onClick={() => {
              if (priceState.kind !== 'priced' || !formattedPrice || !offer) return;
              addToCart({
                productVariantId: offer.productVariantId,
                productName: product.productName,
                variantName: product.productName,
                slug: product.slug,
                price: priceState.price,
                image: image ?? null,
              });
            }}
          >
            В корзину
          </Button>
        )}
      </Box>
    </Box>
  );
}
