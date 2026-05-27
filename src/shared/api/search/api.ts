'use server';

import type { SearchInput, SearchResponse } from '@/shared/model';

import { apiClient } from '../api-client';
import { SEARCH_PRODUCTS } from './queries';

export async function searchProducts(params: SearchInput): Promise<SearchResponse> {
  const data = await apiClient.request<{ search: SearchResponse }>(SEARCH_PRODUCTS, {
    input: { groupByProduct: true, ...params },
  });
  return data.search;
}
