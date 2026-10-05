'use client';

import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { Box, Button, IconButton, Typography } from '@mui/material';
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
  const setItemQuantity = useCartStore((s) => s.setItemQuantity);
  const variantId = product.chosenOffer?.productVariantId;
  const cartQuantity = useCartStore((s) => {
    if (!variantId) return 0;
    return s.items.find((i) => i.productVariantId === variantId)?.quantity ?? 0;
  });

  const offer = product.chosenOffer;
  const image = offer?.productAsset?.preview ?? product.productAsset?.preview;
  const href = routes.product(product.slug, offer?.productVariantId);
  const currency = normalizeCurrencyCode(offer?.currencyCode);
  const price = normalizeMinorPrice(offer?.priceWithTax);
  const formattedPrice = price !== undefined && currency ? priceFormatter(price, currency) : undefined;
  const basePrice = normalizeMinorPrice(offer?.basePriceWithTax);
  const formattedBasePrice = basePrice !== undefined && currency ? priceFormatter(basePrice, currency) : undefined;
  const showDiscount = Boolean(offer && Number.isFinite(offer.discountPercent) && offer.discountPercent > 0 && formattedBasePrice);
  const canAdd = price !== undefined && !!currency && !!formattedPrice && !!offer;
  const inCart = cartQuantity > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    addToCart({
      productVariantId: offer.productVariantId,
      productName: product.productName,
      variantName: product.productName,
      slug: product.slug,
      price,
      image: image ?? null,
    });
  };

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
              mixBlendMode: 'multiply',
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
          <Typography sx={{ fontSize: 21, fontWeight: 800, color: '#1B2B45' }}>{formattedPrice ?? 'Цена уточняется'}</Typography>
          {showDiscount && formattedBasePrice && <Typography sx={{ fontSize: 14, color: '#6B7586', textDecoration: 'line-through' }}>{formattedBasePrice}</Typography>}
        </Box>

        {inCart ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 46,
              border: '1.5px solid #1B2B45',
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            <IconButton
              onClick={() => variantId && setItemQuantity(variantId, cartQuantity - 1)}
              sx={{ borderRadius: 0, px: 1.5, color: '#1B2B45' }}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1B2B45' }}>{cartQuantity}</Typography>
            <IconButton
              onClick={handleAdd}
              sx={{ borderRadius: 0, px: 1.5, color: '#1B2B45' }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Button
            variant="outlined"
            fullWidth
            disabled={!canAdd}
            sx={{
              height: 46,
              border: '1.5px solid #1B2B45',
              borderRadius: '10px',
              color: '#1B2B45',
              fontWeight: 600,
              '&:hover': { bgcolor: '#1B2B45', color: '#FFFFFF', borderColor: '#1B2B45' },
            }}
            onClick={handleAdd}
          >
            В корзину
          </Button>
        )}
      </Box>
    </Box>
  );
}
