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
