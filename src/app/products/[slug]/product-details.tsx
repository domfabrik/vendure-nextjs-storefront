'use client';

import { Box, Chip, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import type { Asset, Product, ProductVariant } from '@/shared/api';
import { priceFormatter } from '@/shared/lib';
import { AddToCartButton } from '@/shared/ui/add-to-cart-button';
import { ProductCharacteristics } from './product-characteristics';
import { ProductGallery } from './product-gallery';

interface ProductDetailsProps {
  product: Product;
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

export function ProductDetails({ product }: ProductDetailsProps) {
  const defaultVariant = product.variants[0];

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

  const variant = useMemo(() => findVariant(product, selectedOptions), [product, selectedOptions]);

  const images = useMemo(() => getImagesForVariant(product, variant), [product, variant]);

  const inStock = variant ? Number(variant.stockLevel) > 0 : false;
  const lowStock = inStock && Number(variant?.stockLevel || 0) <= 10;
  const hasDiscount = (variant?.customFields.discountPercent ?? 0) > 0;
  const featuredImage = variant?.featuredAsset ?? product.featuredAsset;

  const handleOptionClick = (groupId: string, optionId: string) => {
    if (selectedOptions[groupId] === optionId) return;
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
            stockLevel: Number(relatedVariant.stockLevel),
            isSelected: selectedOptions[group.id] === option.id,
          };
        })
        .filter(Boolean) as Array<{
        name: string;
        id: string;
        code: string;
        stockLevel: number;
        isSelected: boolean;
      }>,
    }));
  }, [product, selectedOptions]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 4,
      }}
    >
      {/* Gallery */}
      <Box sx={{ flex: { md: '0 0 50%' }, maxWidth: { md: '50%' } }}>
        <ProductGallery
          images={images}
          name={product.name}
        />
      </Box>

      {/* Info */}
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 700, mb: 2 }}
        >
          {product.name}
        </Typography>

        {variant && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, lineHeight: 1.2 }}
              >
                {priceFormatter(variant.priceWithTax)}
              </Typography>
              {hasDiscount && (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ textDecoration: 'line-through', lineHeight: 1.2 }}
                >
                  {priceFormatter(variant.basePriceWithTax)}
                </Typography>
              )}
            </Box>
            {hasDiscount && (
              <Chip
                label={`-${variant.customFields.discountPercent}%`}
                color="error"
                size="small"
                sx={{ fontWeight: 700 }}
              />
            )}
          </Box>
        )}

        {/* Stock */}
        <Box sx={{ mb: 3 }}>
          {!variant ? (
            <Chip
              label="Скоро в продаже"
              color="default"
              size="small"
            />
          ) : inStock ? (
            <>
              <Chip
                label="В наличии"
                color="success"
                size="small"
              />
              {lowStock && (
                <Typography
                  variant="body2"
                  color="error"
                  sx={{ mt: 1 }}
                >
                  Торопитесь, осталось всего {variant.stockLevel} шт.!
                </Typography>
              )}
            </>
          ) : (
            <Chip
              label="Нет в наличии"
              color="error"
              size="small"
            />
          )}
        </Box>

        {/* Add to cart */}
        {variant && inStock && (
          <Box sx={{ mb: 3 }}>
            <AddToCartButton
              variantId={variant.id}
              productName={product.name}
              variantName={variant.name}
              slug={product.slug}
              price={variant.priceWithTax}
              image={featuredImage?.preview ?? null}
            />
          </Box>
        )}

        {/* Options */}
        {enrichedGroups.length > 0 && (
          <Box sx={{ mb: 3 }}>
            {enrichedGroups.map((group) => (
              <Box
                key={group.id}
                sx={{ mb: 2 }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  {group.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {group.options.map((option) => (
                    <Chip
                      key={option.id}
                      label={option.name}
                      variant={option.isSelected ? 'filled' : 'outlined'}
                      color={option.isSelected ? 'primary' : 'default'}
                      size="small"
                      onClick={() => handleOptionClick(group.id, option.id)}
                      sx={{
                        cursor: 'pointer',
                        opacity: option.stockLevel > 0 ? 1 : 0.5,
                        textDecoration: option.stockLevel > 0 ? 'none' : 'line-through',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* SKU */}
        {variant?.sku && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Артикул: {variant.sku}
          </Typography>
        )}

        {/* Description */}
        {product.description && (
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, mb: 1 }}
            >
              Описание
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </Box>
        )}

        {/* Characteristics */}
        <ProductCharacteristics
          productCustomFields={product.customFields}
          variantCustomFields={variant?.customFields ?? null}
        />
      </Box>
    </Box>
  );
}
