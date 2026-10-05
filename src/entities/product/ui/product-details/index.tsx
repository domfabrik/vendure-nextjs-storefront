'use client';

import AddIcon from '@mui/icons-material/Add';
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import type { Asset, Product, ProductVariant } from '@/shared/api';
import { GA4_CONSENT_CHANGE_EVENT, normalizeCatalogStock, normalizeCurrencyCode, normalizeMinorPrice, priceFormatter, trackGa4ViewItem } from '@/shared/lib';
import { contacts } from '@/shared/router';
import { useCartStore } from '@/shared/store';
import { formatDimensionValue } from '../../lib/characteristics';
import { ProductGallery } from './product-gallery';

interface ProductDetailsProps {
  product: Product;
  initialVariantId?: string;
}

function findVariant(product: Product, selectedOptions: Record<string, string>): ProductVariant | undefined {
  return product.variants.find((v) => v.options.every((vo) => selectedOptions[vo.groupId] === vo.id));
}

function getImagesForVariant(product: Product, variant: ProductVariant | undefined): Asset[] {
  const feat = variant?.featuredAsset ?? product.featuredAsset;
  const assets = variant?.assets?.length ? variant.assets : product.assets;
  if (feat && !assets.some((a) => a.source === feat.source)) {
    return [feat, ...assets];
  }
  return assets;
}

export function ProductDetails({ product, initialVariantId }: ProductDetailsProps) {
  const addToCart = useCartStore((s) => s.addToCart);
  const setItemQuantity = useCartStore((s) => s.setItemQuantity);
  const cartItems = useCartStore((s) => s.items);
  const defaultVariant = product.variants.find((variant) => variant.id === initialVariantId) ?? product.variants[0];

  const initialSelected = useMemo(() => {
    const sel: Record<string, string> = {};
    if (defaultVariant) {
      for (const opt of defaultVariant.options) {
        sel[opt.groupId] = opt.id;
      }
    }
    return sel;
  }, [defaultVariant]);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(initialSelected);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(defaultVariant?.id);
  const [consentRevision, setConsentRevision] = useState(0);

  const variant = useMemo(
    () => product.variants.find((candidate) => candidate.id === selectedVariantId) ?? findVariant(product, selectedOptions),
    [product, selectedOptions, selectedVariantId],
  );

  const images = useMemo(() => getImagesForVariant(product, variant), [product, variant]);

  const stock = normalizeCatalogStock(variant?.stockLevel);
  const price = normalizeMinorPrice(variant?.priceWithTax);
  const basePrice = normalizeMinorPrice(variant?.basePriceWithTax);
  const currency = normalizeCurrencyCode(variant?.currencyCode);
  const discountPercent = variant?.customFields.discountPercent;
  const hasDiscount = typeof discountPercent === 'number' && Number.isFinite(discountPercent) && discountPercent > 0 && basePrice !== undefined;
  const featuredImage = variant?.featuredAsset ?? product.featuredAsset;
  const categoryName = product.collections.find((collection) => collection.slug !== 'all' && collection.slug !== 'search')?.name;

  const savings = hasDiscount && price !== undefined && basePrice !== undefined ? basePrice - price : 0;
  const cartItem = variant ? cartItems.find((i) => i.productVariantId === variant.id) : undefined;
  const cartQuantity = cartItem?.quantity ?? 0;
  const inCart = cartQuantity > 0;

  useEffect(() => {
    const onConsentChange = () => setConsentRevision((revision) => revision + 1);
    window.addEventListener(GA4_CONSENT_CHANGE_EVENT, onConsentChange);
    return () => window.removeEventListener(GA4_CONSENT_CHANGE_EVENT, onConsentChange);
  }, []);

  useEffect(() => {
    if (!variant || price === undefined || currency !== 'RUB') return;
    trackGa4ViewItem({
      variantId: variant.id,
      name: product.name,
      variant: variant.name,
      category: categoryName,
      unitPriceMinor: price,
    });
  }, [categoryName, consentRevision, currency, price, product.name, variant?.id, variant?.name]);

  const handleOptionClick = (groupId: string, optionId: string) => {
    if (selectedOptions[groupId] === optionId) return;
    setSelectedVariantId(undefined);
    setSelectedOptions((prev) => ({ ...prev, [groupId]: optionId }));
  };

  const enrichedGroups = useMemo(() => {
    return product.optionGroups.map((group) => ({
      ...group,
      options: group.options
        .map((option) => {
          const testSelected = { ...selectedOptions, [group.id]: option.id };
          const relatedVariant = findVariant(product, testSelected);
          if (!relatedVariant) return null;
          return {
            ...option,
            stock: normalizeCatalogStock(relatedVariant.stockLevel),
            isSelected: selectedOptions[group.id] === option.id,
            preview: relatedVariant.featuredAsset?.preview ?? null,
          };
        })
        .filter(Boolean) as Array<{
        name: string;
        id: string;
        code: string;
        stock: ReturnType<typeof normalizeCatalogStock>;
        isSelected: boolean;
        preview: string | null;
      }>,
    }));
  }, [product, selectedOptions]);

  const handleAddToCart = () => {
    if (!variant || price === undefined || !currency) return;
    addToCart({
      productVariantId: variant.id,
      productName: product.name,
      variantName: variant.name,
      slug: product.slug,
      price,
      image: featuredImage?.preview ?? null,
    });
  };

  // Build quick-spec tags
  const quickTags: string[] = [];
  const dims = product.customFields.dimensionsMm;
  if (dims) {
    const formatted = typeof dims === 'string' ? formatDimensionValue(dims) : formatDimensionValue(dims);
    if (formatted) quickTags.push(formatted);
  }
  if (product.customFields.warrantyMonths) {
    quickTags.push(`Гарантия ${product.customFields.warrantyMonths} мес.`);
  }
  if (product.customFields.packageCount) {
    quickTags.push(`${product.customFields.packageCount} упак.`);
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
        gap: { xs: 3, md: 5 },
      }}
    >
      {/* Gallery */}
      <ProductGallery
        images={images}
        name={product.name}
        discountPercent={hasDiscount ? discountPercent : undefined}
      />

      {/* Buy Box */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* 1. Meta block */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
          {product.customFields.vendorName && (
            <Typography
              sx={{
                bgcolor: '#F5F2EC',
                px: 1.25,
                py: 0.5,
                borderRadius: '6px',
                fontSize: 13,
                fontWeight: 600,
                color: '#5A6475',
              }}
            >
              {product.customFields.vendorName}
            </Typography>
          )}
          {variant && stock.purchasable && (
            <Typography
              sx={{
                bgcolor: '#E7F3EA',
                px: 1.25,
                py: 0.5,
                borderRadius: '6px',
                fontSize: 13,
                fontWeight: 600,
                color: '#2E7D32',
              }}
            >
              В наличии
            </Typography>
          )}
          {variant && !stock.purchasable && stock.kind === 'out-of-stock' && (
            <Typography
              sx={{
                bgcolor: '#FDEAEA',
                px: 1.25,
                py: 0.5,
                borderRadius: '6px',
                fontSize: 13,
                fontWeight: 600,
                color: '#C62828',
              }}
            >
              Нет в наличии
            </Typography>
          )}
          {variant?.sku && <Typography sx={{ fontSize: 13, color: '#8B9099' }}>Арт. {variant.sku}</Typography>}
        </Box>

        {/* 2. Title */}
        <Typography
          variant="h1"
          sx={{ fontSize: { xs: 28, md: 36 }, fontWeight: 800, lineHeight: 1.15, color: '#1B2B45' }}
        >
          {product.name}
        </Typography>

        {/* 3. Quick-spec tags */}
        {quickTags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {quickTags.map((tag) => (
              <Typography
                key={tag}
                sx={{
                  border: '1px solid #E6E2DB',
                  borderRadius: '8px',
                  px: 1.25,
                  py: 0.75,
                  fontSize: 13,
                  color: '#5A6475',
                  lineHeight: 1,
                }}
              >
                {tag}
              </Typography>
            ))}
          </Box>
        )}

        {/* 4. Variant selector (cards with thumbnails) */}
        {enrichedGroups.length > 0 &&
          enrichedGroups.map((group) => (
            <Box key={group.id}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#5A6475', mb: 1.5 }}>{group.name}</Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 1.5,
                }}
              >
                {group.options.map((option) => (
                  <Box
                    key={option.id}
                    onClick={() => handleOptionClick(group.id, option.id)}
                    sx={{
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: option.isSelected ? '#1B2B45' : '#E6E2DB',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      opacity: option.stock.kind === 'out-of-stock' ? 0.5 : 1,
                      transition: 'border-color 0.2s',
                      '&:hover': { borderColor: option.isSelected ? '#1B2B45' : '#A8A29E' },
                    }}
                  >
                    {option.preview && (
                      <Box
                        sx={{
                          aspectRatio: '4 / 3',
                          bgcolor: '#F3F1EE',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          p: 1,
                        }}
                      >
                        <img
                          src={option.preview}
                          alt={option.name}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            mixBlendMode: 'multiply',
                          }}
                        />
                      </Box>
                    )}
                    <Typography
                      sx={{
                        textAlign: 'center',
                        fontSize: 12,
                        fontWeight: option.isSelected ? 600 : 400,
                        color: '#1B2B45',
                        py: 0.75,
                        px: 0.5,
                        lineHeight: 1.3,
                      }}
                    >
                      {option.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}

        {/* 5. Price block */}
        {variant && (
          <Box
            sx={{
              border: '1px solid #E6E2DB',
              borderRadius: '16px',
              p: 3,
            }}
          >
            {price !== undefined && currency ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 1 }}>
                  <Typography sx={{ fontSize: 36, fontWeight: 800, color: '#1B2B45', lineHeight: 1 }}>{priceFormatter(price, currency)}</Typography>
                </Box>
                {hasDiscount && basePrice !== undefined && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Typography sx={{ fontSize: 18, color: '#8B9099', textDecoration: 'line-through' }}>{priceFormatter(basePrice, currency)}</Typography>
                    {savings > 0 && (
                      <Typography
                        sx={{
                          bgcolor: '#F6ECE3',
                          color: '#7A4520',
                          fontSize: 13,
                          fontWeight: 600,
                          px: 1,
                          py: 0.5,
                          borderRadius: '6px',
                        }}
                      >
                        Экономия {priceFormatter(savings, currency)}
                      </Typography>
                    )}
                  </Box>
                )}
                {!hasDiscount && <Box sx={{ mb: 2 }} />}

                {/* Quantity + Add to Cart */}
                {stock.purchasable && (
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'stretch' }}>
                    {inCart ? (
                      <>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            flexShrink: 0,
                            border: '1px solid #E6E2DB',
                            borderRadius: '12px',
                          }}
                        >
                          <IconButton
                            onClick={() => setItemQuantity(variant.id, cartQuantity - 1)}
                            sx={{ borderRadius: 0, px: 1.5, color: '#1B2B45' }}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography sx={{ minWidth: 36, textAlign: 'center', fontSize: 16, fontWeight: 600 }}>{cartQuantity}</Typography>
                          <IconButton
                            onClick={handleAddToCart}
                            sx={{ borderRadius: 0, px: 1.5, color: '#1B2B45' }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <Button
                          variant="contained"
                          fullWidth
                          disabled
                          startIcon={<ShoppingCartIcon />}
                          sx={{
                            bgcolor: '#1B2B45',
                            height: 54,
                            borderRadius: '12px',
                            fontSize: 16,
                            fontWeight: 600,
                            textTransform: 'none',
                            '&.Mui-disabled': { bgcolor: '#1B2B45', color: 'rgba(255,255,255,0.7)' },
                          }}
                        >
                          В корзине
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleAddToCart}
                        startIcon={<ShoppingCartIcon />}
                        sx={{
                          bgcolor: '#1B2B45',
                          height: 54,
                          borderRadius: '12px',
                          fontSize: 16,
                          fontWeight: 600,
                          textTransform: 'none',
                          '&:hover': { bgcolor: '#152236' },
                        }}
                      >
                        В корзину
                      </Button>
                    )}
                  </Box>
                )}
              </>
            ) : (
              <Typography sx={{ fontSize: 18, color: '#6B7586' }}>Цена уточняется</Typography>
            )}
          </Box>
        )}

        {/* 6. Services */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LocalShippingOutlined sx={{ fontSize: 22, color: '#5A6475' }} />
            <Typography sx={{ fontSize: 14, color: '#343E50' }}>Доставка по России</Typography>
          </Box>
          {product.customFields.warrantyMonths && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ShieldOutlined sx={{ fontSize: 22, color: '#5A6475' }} />
              <Typography sx={{ fontSize: 14, color: '#343E50' }}>Гарантия фабрики {product.customFields.warrantyMonths} мес.</Typography>
            </Box>
          )}
        </Box>

        {/* 7. Promo block */}
        <Box
          sx={{
            bgcolor: '#F5F2EC',
            borderRadius: '16px',
            p: 3,
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1B2B45', mb: 1 }}>Поможем рассчитать кухню и мебель под ваши размеры</Typography>
          <Typography sx={{ fontSize: 14, color: '#343E50', mb: 1.5 }}>Позвоните нам или оставьте заявку, и мы свяжемся с вами</Typography>
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 700,
              color: '#1B2B45',
            }}
          >
            <a
              href={contacts.phoneHref}
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              {contacts.phone}
            </a>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
