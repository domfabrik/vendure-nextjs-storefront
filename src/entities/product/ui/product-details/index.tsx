'use client';

import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import { Box, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import type { Asset, Product, ProductVariant } from '@/shared/api';
import { GA4_CONSENT_CHANGE_EVENT, normalizeCatalogStock, normalizeCurrencyCode, normalizeMinorPrice, trackGa4ViewItem } from '@/shared/lib';
import { contacts } from '@/shared/router';
import { useCartStore } from '@/shared/store';
import { formatDimensionValue } from '../../lib/characteristics';
import { PriceBlock } from './price-block';
import { ProductGallery } from './product-gallery';
import { VariantSelector } from './variant-selector';

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

function buildQuickTags(product: Product): string[] {
  const tags: string[] = [];
  const dims = product.customFields.dimensionsMm;
  if (dims) {
    const formatted = formatDimensionValue(dims as string);
    if (formatted) tags.push(formatted);
  }
  if (product.customFields.warrantyMonths) {
    tags.push(`Гарантия ${product.customFields.warrantyMonths} мес.`);
  }
  if (product.customFields.packageCount) {
    tags.push(`${product.customFields.packageCount} упак.`);
  }
  return tags;
}

export function ProductDetails({ product, initialVariantId }: ProductDetailsProps) {
  const addToCart = useCartStore((s) => s.addToCart);
  const setItemQuantity = useCartStore((s) => s.setItemQuantity);
  const cartItems = useCartStore((s) => s.items);
  const defaultVariant = product.variants.find((v) => v.id === initialVariantId) ?? product.variants[0];

  const initialSelected = (() => {
    const sel: Record<string, string> = {};
    if (defaultVariant) {
      for (const opt of defaultVariant.options) {
        sel[opt.groupId] = opt.id;
      }
    }
    return sel;
  })();

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(initialSelected);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(defaultVariant?.id);

  const variant = product.variants.find((c) => c.id === selectedVariantId) ?? findVariant(product, selectedOptions);
  const images = getImagesForVariant(product, variant);

  const stock = normalizeCatalogStock(variant?.stockLevel);
  const price = normalizeMinorPrice(variant?.priceWithTax);
  const basePrice = normalizeMinorPrice(variant?.basePriceWithTax);
  const currency = normalizeCurrencyCode(variant?.currencyCode);
  const discountPercent = variant?.customFields.discountPercent;
  const hasDiscount = typeof discountPercent === 'number' && Number.isFinite(discountPercent) && discountPercent > 0 && basePrice !== undefined;
  const featuredImage = variant?.featuredAsset ?? product.featuredAsset;
  const categoryName = product.collections.find((col) => col.slug !== 'all' && col.slug !== 'search')?.name;
  const savings = hasDiscount && price !== undefined && basePrice !== undefined ? basePrice - price : 0;
  const cartItem = variant ? cartItems.find((i) => i.productVariantId === variant.id) : undefined;
  const cartQuantity = cartItem?.quantity ?? 0;
  const inCart = cartQuantity > 0;
  const quickTags = buildQuickTags(product);

  // GA4 view_item — single effect handles both mount and consent changes
  useEffect(() => {
    const track = () => {
      if (!variant || price === undefined || currency !== 'RUB') return;
      trackGa4ViewItem({ variantId: variant.id, name: product.name, variant: variant.name, category: categoryName, unitPriceMinor: price });
    };
    track();
    window.addEventListener(GA4_CONSENT_CHANGE_EVENT, track);
    return () => window.removeEventListener(GA4_CONSENT_CHANGE_EVENT, track);
  }, [categoryName, currency, price, product.name, variant?.id, variant?.name]);

  const handleOptionClick = (groupId: string, optionId: string) => {
    if (selectedOptions[groupId] === optionId) return;
    setSelectedVariantId(undefined);
    setSelectedOptions((prev) => ({ ...prev, [groupId]: optionId }));
  };

  const enrichedGroups = product.optionGroups.map((group) => ({
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

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
        gap: { xs: 3, md: 5 },
      }}
    >
      <ProductGallery
        images={images}
        name={product.name}
        discountPercent={hasDiscount ? discountPercent : undefined}
      />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Meta */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
          {product.customFields.vendorName && (
            <Typography
              variant="overline"
              sx={{ bgcolor: 'warmBg', px: 1.25, py: 0.5, borderRadius: '6px', fontWeight: 600, color: 'text.secondary' }}
            >
              {product.customFields.vendorName}
            </Typography>
          )}
          {variant && stock.purchasable && (
            <Typography
              variant="overline"
              sx={{ bgcolor: 'success.light', px: 1.25, py: 0.5, borderRadius: '6px', fontWeight: 600, color: 'success.main' }}
            >
              В наличии
            </Typography>
          )}
          {variant && !stock.purchasable && stock.kind === 'out-of-stock' && (
            <Typography
              variant="overline"
              sx={{ bgcolor: 'error.light', px: 1.25, py: 0.5, borderRadius: '6px', fontWeight: 600, color: 'error.main' }}
            >
              Нет в наличии
            </Typography>
          )}
          {variant?.sku && (
            <Typography
              variant="overline"
              sx={{ color: 'text.hint' }}
            >
              Арт. {variant.sku}
            </Typography>
          )}
        </Box>

        {/* Title */}
        <Typography
          variant="h2"
          sx={{ lineHeight: 1.15 }}
        >
          {product.name}
        </Typography>

        {/* Quick tags */}
        {quickTags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {quickTags.map((tag) => (
              <Typography
                key={tag}
                variant="overline"
                sx={(t) => ({ border: `1px solid ${t.palette.border.main}`, borderRadius: '8px', px: 1.25, py: 0.75, color: 'text.secondary', lineHeight: 1 })}
              >
                {tag}
              </Typography>
            ))}
          </Box>
        )}

        {/* Variants */}
        <VariantSelector
          groups={enrichedGroups}
          onSelect={handleOptionClick}
        />

        {/* Price */}
        {variant && price !== undefined && currency ? (
          <PriceBlock
            price={price}
            currency={currency}
            basePrice={basePrice}
            savings={savings}
            hasDiscount={hasDiscount}
            purchasable={stock.purchasable}
            inCart={inCart}
            cartQuantity={cartQuantity}
            onAdd={handleAddToCart}
            onChangeQuantity={(q) => setItemQuantity(variant.id, q)}
          />
        ) : variant ? (
          <Box sx={(t) => ({ border: `1px solid ${t.palette.border.main}`, borderRadius: '16px', p: 3 })}>
            <Typography
              variant="h6"
              sx={{ color: 'text.muted' }}
            >
              Цена уточняется
            </Typography>
          </Box>
        ) : null}

        {/* Services */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LocalShippingOutlined sx={{ fontSize: 22, color: 'text.secondary' }} />
            <Typography
              variant="body2"
              sx={{ color: 'primary.light' }}
            >
              Доставка по России
            </Typography>
          </Box>
          {product.customFields.warrantyMonths && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ShieldOutlined sx={{ fontSize: 22, color: 'text.secondary' }} />
              <Typography
                variant="body2"
                sx={{ color: 'primary.light' }}
              >
                Гарантия фабрики {product.customFields.warrantyMonths} мес.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Promo */}
        <Box sx={{ bgcolor: 'warmBg', borderRadius: '16px', p: 3 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: 'text.primary', mb: 1 }}>Поможем рассчитать кухню и мебель под ваши размеры</Typography>
          <Typography
            variant="body2"
            sx={{ color: 'primary.light', mb: 1.5 }}
          >
            Позвоните нам или оставьте заявку, и мы свяжемся с вами
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: 'text.primary' }}
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
