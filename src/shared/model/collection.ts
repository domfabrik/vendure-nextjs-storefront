export interface Collection {
  name: string;
  slug: string;
  description: string;
  featuredAsset: { preview: string } | null;
  parent: { slug: string; name: string };
  children: CollectionChild[];
}

export interface CollectionChild {
  id: string;
  name: string;
  slug: string;
  featuredAsset: { preview: string } | null;
}

export interface CollectionTile {
  name: string;
  id: string;
  slug: string;
  parent: { id: string; slug: string } | null;
  description: string;
  featuredAsset: { preview: string } | null;
}

export interface CollectionTileProductVariant {
  id: string;
  featuredAsset: { preview: string } | null;
  priceWithTax: number;
  currencyCode: string;
  name: string;
  product: {
    name: string;
    slug: string;
    featuredAsset: { preview: string } | null;
  };
}

export interface NavigationCollection extends CollectionTile {
  productVariants?: {
    items: CollectionTileProductVariant[];
    totalItems: number;
  };
}

export interface HomepageProductPrice {
  __typename: 'PriceRange' | 'SinglePrice';
  max?: number;
  min?: number;
  value?: number;
}

export interface HomepageProduct {
  productName: string;
  slug: string;
  productVariantId: string;
  currencyCode: string;
  discountPercent: number;
  basePriceWithTax: HomepageProductPrice;
  priceWithTax: HomepageProductPrice;
  productAsset: { preview: string } | null;
}

export interface HomepageCollection {
  unavailable?: boolean;
  name: string;
  slug: string;
  totalItems: number;
  products: HomepageProduct[];
}
