export interface Asset {
  source: string;
  preview: string;
}

export interface ProductOptionGroup {
  name: string;
  id: string;
  code: string;
  options: ProductOption[];
}

export interface ProductOption {
  name: string;
  id: string;
  code: string;
}

export interface ProductVariantOption {
  id: string;
  groupId: string;
  code: string;
  name: string;
}

export interface ProductCustomFields {
  vendorName: string | null;
  packageCount: number | null;
  warrantyMonths: number | null;
  weightKg: number | null;
  volumeM3: number | null;
  dimensionsMm: string | null;
  includedItems: string | null;
  decor: string | null;
  additionalInfo: string | null;
  packagingNotes: string | null;
  maxLoadKg: number | null;
  minimumDoorWidthCm: number | null;
  frameMaterialText: string | null;
  facadeMaterialText: string | null;
  edgeMaterialText: string | null;
  shelfMaterialText: string | null;
  hardwareText: string | null;
  frontHardwareText: string | null;
  drawerMaterialText: string | null;
  countertopMaterialText: string | null;
  upholsteryText: string | null;
  kitchenShape: string | null;
  kitchenElements: string | null;
  countertopDimensionsMm: string | null;
  bedDimensionsMm: string | null;
  recommendedMattressHeightMm: number | null;
  mattressInsetMm: number | null;
  mattressBase: string | null;
}

export interface ProductVariantCustomFields {
  oldPrice: number | null;
  finishLabel: string | null;
  finishDescription: string | null;
  upholsteryLabel: string | null;
  upholsteryDescription: string | null;
  profileLabel: string | null;
  profileDescription: string | null;
}

export interface ProductVariant {
  id: string;
  name: string;
  currencyCode: string;
  priceWithTax: number;
  stockLevel: string;
  sku: string;
  featuredAsset: Asset | null;
  assets: Asset[];
  options: ProductVariantOption[];
  customFields: ProductVariantCustomFields;
}

export interface ProductFacetValue {
  name: string;
  id: string;
  translations: { name: string; languageCode: string; id: string }[];
}

export interface Product {
  name: string;
  description: string;
  id: string;
  slug: string;
  optionGroups: ProductOptionGroup[];
  assets: Asset[];
  variants: ProductVariant[];
  collections: { slug: string; name: string; parent: { slug: string } }[];
  featuredAsset: Asset | null;
  facetValues: ProductFacetValue[];
  customFields: ProductCustomFields;
}

export interface SearchResultPrice {
  __typename: 'PriceRange' | 'SinglePrice';
  max?: number;
  min?: number;
  value?: number;
}

export interface SearchResult {
  productName: string;
  slug: string;
  collectionIds: string[];
  currencyCode: string;
  productVariantId: string;
  productVariantName: string;
  priceWithTax: SearchResultPrice;
  facetIds: string[];
  facetValueIds: string[];
  productAsset: { preview: string } | null;
  description: string;
}

export interface ProductVariantTile {
  id: string;
  name: string;
  currencyCode: string;
  priceWithTax: number;
  featuredAsset: { preview: string } | null;
  product: {
    collections: { slug: string; name: string; parent: { slug: string } }[];
    slug: string;
    featuredAsset: { preview: string } | null;
  };
}

export interface CollectionSlider {
  name: string;
  slug: string;
  parent: { slug: string };
  productVariants: {
    totalItems: number;
    items: ProductVariantTile[];
  };
}
