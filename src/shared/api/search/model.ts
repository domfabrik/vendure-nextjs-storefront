import { gql } from 'graphql-request';
import type { SearchResult } from '../products/model';

// --- Types ---

export type { SearchResult };

export interface Facet {
  id: string;
  name: string;
  code: string;
}

export interface SearchFacetValue {
  count: number;
  facetValue: Facet & {
    facet: Facet;
  };
}

export interface SearchResponse {
  items: SearchResult[];
  totalItems: number;
  facetValues: SearchFacetValue[];
}

export interface SearchInput {
  collectionSlug?: string;
  take?: number;
  skip?: number;
  term?: string;
  sort?: { name?: 'ASC' | 'DESC'; price?: 'ASC' | 'DESC' };
  facetValueFilters?: { and?: string; or?: string[] }[];
  groupByProduct?: boolean;
}

// --- Queries ---

export const SEARCH_PRODUCTS = gql`
    query SearchProducts($input: SearchInput!) {
        search(input: $input) {
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
            totalItems
            facetValues {
                count
                facetValue {
                    id
                    name
                    code
                    facet {
                        id
                        name
                        code
                    }
                }
            }
        }
    }
`;
