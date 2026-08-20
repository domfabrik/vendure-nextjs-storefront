'use server';

import type { FacetList } from '@/shared/model';
import { apiClient } from '../api-client';
import { GET_FACETS } from './queries';

export async function getFacets(): Promise<FacetList> {
  const data = await apiClient.request<{ facets: FacetList }>(GET_FACETS);
  return data.facets;
}
