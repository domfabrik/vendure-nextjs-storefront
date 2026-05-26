import { gql } from 'graphql-request';

// --- Types ---

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

// --- Queries ---

export const GET_PRODUCT_BY_SLUG = gql`
    query GetProductBySlug($slug: String!) {
        product(slug: $slug) {
            name
            description
            id
            slug
            optionGroups {
                name
                id
                code
                options {
                    name
                    id
                    code
                }
            }
            assets {
                source
                preview
            }
            variants {
                id
                name
                currencyCode
                priceWithTax
                stockLevel
                sku
                featuredAsset {
                    source
                    preview
                }
                assets {
                    source
                    preview
                }
                options {
                    id
                    groupId
                    code
                    name
                }
            }
            collections {
                slug
                name
                parent {
                    slug
                }
            }
            featuredAsset {
                source
                preview
            }
            facetValues {
                name
                id
                translations {
                    name
                    languageCode
                    id
                }
            }
        }
    }
`;

export const GET_FEATURED_PRODUCTS = gql`
    query GetFeaturedProducts($take: Int) {
        search(input: { take: $take, groupByProduct: true, sort: { price: ASC } }) {
            items {
                productName
                slug
                collectionIds
                currencyCode
                productVariantId
                productVariantName
                priceWithTax {
                    __typename
                    ... on PriceRange {
                        max
                        min
                    }
                    ... on SinglePrice {
                        value
                    }
                }
                facetIds
                facetValueIds
                productAsset {
                    preview
                }
                description
            }
        }
    }
`;

export const GET_PRODUCT_SLIDERS = gql`
    query GetProductSliders($slug: String!) {
        collection(slug: $slug) {
            name
            slug
            parent {
                slug
            }
            productVariants(options: { take: 8, sort: { priceWithTax: DESC } }) {
                totalItems
                items {
                    id
                    name
                    currencyCode
                    priceWithTax
                    featuredAsset {
                        preview
                    }
                    product {
                        collections {
                            slug
                            name
                            parent {
                                slug
                            }
                        }
                        slug
                        featuredAsset {
                            preview
                        }
                    }
                }
            }
        }
    }
`;
