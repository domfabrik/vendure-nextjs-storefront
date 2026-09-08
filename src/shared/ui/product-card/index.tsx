'use client';

import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Box, Card, CardContent, IconButton, Typography } from '@mui/material';
import { routes } from '@routes';
import NextLink from 'next/link';
import { normalizeCurrencyCode, normalizeMinorPrice, priceFormatter } from '@/shared/lib';
import type { HomepageProduct } from '@/shared/model';
import { useCartStore } from '@/shared/store/cart';

interface ProductCardProps {
  product: HomepageProduct;
  imgHeight?: string;
}

export function ProductCard({ product, imgHeight }: ProductCardProps) {
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
                -{offer?.discountPercent}%
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
                if (!offer) return;
                addToCart({
                  productVariantId: offer.productVariantId,
                  productName: product.productName,
                  variantName: product.productName,
                  slug: product.slug,
                  price,
                  image: image ?? null,
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
