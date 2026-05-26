'use server';

import { apiClient } from '../api-client';
import { SEARCH_PRODUCTS, type SearchInput, type SearchResponse } from './model';

export async function searchProducts(params: SearchInput): Promise<SearchResponse> {
  const data = await apiClient.request<{ search: SearchResponse }>(SEARCH_PRODUCTS, {
    input: { groupByProduct: true, ...params },
  });
  return data.search;
}
