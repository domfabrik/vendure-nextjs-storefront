import { gql } from 'graphql-request';

// --- Types ---

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
  priceWithTax: HomepageProductPrice;
  productAsset: { preview: string } | null;
}

export interface HomepageCollection {
  name: string;
  slug: string;
  totalItems: number;
  products: HomepageProduct[];
}

// --- Queries ---

export const GET_COLLECTION_BY_SLUG = gql`
    query GetCollectionBySlug($slug: String!) {
        collection(slug: $slug) {
            name
            slug
            description
            featuredAsset {
                preview
            }
            parent {
                slug
                name
            }
            children {
                id
                name
                slug
                featuredAsset {
                    preview
                }
            }
        }
    }
`;

export const GET_ALL_COLLECTIONS = gql`
    query GetAllCollections {
        collections(options: { filter: { slug: { notEq: "search" } } }) {
            items {
                name
                id
                slug
                parent {
                    id
                    slug
                }
                description
                featuredAsset {
                    preview
                }
            }
        }
    }
`;

export const SEARCH_COLLECTION_PRODUCTS = gql`
    query SearchCollectionProducts($collectionSlug: String!, $take: Int) {
        search(input: { collectionSlug: $collectionSlug, take: $take, groupByProduct: true }) {
            totalItems
            items {
                productName
                slug
                productVariantId
                currencyCode
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
                productAsset {
                    preview
                }
            }
        }
    }
`;

export const GET_COLLECTION_PRODUCT_VARIANTS = gql`
    query GetCollectionProductVariants($slug: String!) {
        collection(slug: $slug) {
            id
            productVariants(options: { take: 4, sort: { createdAt: ASC } }) {
                totalItems
                items {
                    id
                    featuredAsset {
                        preview
                    }
                    priceWithTax
                    currencyCode
                    name
                    product {
                        name
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
