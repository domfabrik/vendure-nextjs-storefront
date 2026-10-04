'use server';

import type { SearchFacetResponse, SearchInput, SearchResponse } from '@/shared/model';

import { apiClient } from '../api-client';
import { SEARCH_FACETS, SEARCH_PRODUCTS } from './queries';

export async function searchProducts(params: SearchInput): Promise<SearchResponse> {
  const data = await apiClient.request<{ search: SearchResponse }>(SEARCH_PRODUCTS, {
    input: { groupByProduct: true, ...params },
  });
  return data.search;
}

export async function searchFacets(params: SearchInput): Promise<SearchFacetResponse> {
  const data = await apiClient.request<{ search: SearchFacetResponse }>(SEARCH_FACETS, {
    input: { groupByProduct: true, ...params },
  });
  return data.search;
}
