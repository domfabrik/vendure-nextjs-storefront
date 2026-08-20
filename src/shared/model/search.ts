import type { SearchResult } from './product';

export type { SearchResult };

export interface Facet {
  id: string;
  name: string;
  code: string;
}

export interface FacetValue {
  id: string;
  name: string;
  code: string;
}

export interface FacetWithValues {
  id: string;
  name: string;
  code: string;
  values: FacetValue[];
}

export interface FacetList {
  items: FacetWithValues[];
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
