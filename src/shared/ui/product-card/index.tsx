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
      sx={(t) => ({
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${t.palette.border.main}`,
        borderRadius: '16px',
        overflow: 'hidden',
        bgcolor: 'background.default',
        '&:hover img': {
          transform: 'scale(1.05)',
        },
      })}
    >
      <NextLink
        href={href}
        style={{ textDecoration: 'none' }}
      >
        <Box
          sx={{
            position: 'relative',
            aspectRatio: '4 / 3',
            bgcolor: 'neutral',
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
              variant="caption"
              sx={{
                position: 'absolute',
                top: 12,
                left: 12,
                bgcolor: 'background.default',
                color: 'accent.main',
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
          <Typography sx={{ fontSize: 16, fontWeight: 600, lineHeight: 1.35, color: 'text.primary' }}>{product.productName}</Typography>
        </NextLink>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.25, mt: 'auto' }}>
          <Typography variant="price">{formattedPrice ?? 'Цена уточняется'}</Typography>
          {showDiscount && formattedBasePrice && (
            <Typography
              variant="body2"
              sx={{ color: 'text.muted', textDecoration: 'line-through' }}
            >
              {formattedBasePrice}
            </Typography>
          )}
        </Box>

        {inCart ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 46,
              border: '1.5px solid',
              borderColor: 'primary.main',
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            <IconButton
              onClick={() => variantId && setItemQuantity(variantId, cartQuantity - 1)}
              sx={{ borderRadius: 0, px: 1.5, color: 'primary.main' }}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: 'text.primary' }}>{cartQuantity}</Typography>
            <IconButton
              onClick={handleAdd}
              sx={{ borderRadius: 0, px: 1.5, color: 'primary.main' }}
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
              border: '1.5px solid',
              borderColor: 'primary.main',
              borderRadius: '10px',
              color: 'primary.main',
              fontWeight: 600,
              '&:hover': { bgcolor: 'primary.main', color: 'text.contrast', borderColor: 'primary.main' },
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
