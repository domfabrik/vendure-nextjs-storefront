import type { SearchInput } from '@/shared/model';

export const HEADER_SEARCH_TAKE = 6;

export function buildHeaderSearchInput(term: string): SearchInput {
  return { term, take: HEADER_SEARCH_TAKE };
}
