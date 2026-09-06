import { createSearchParamsCache, parseAsInteger, parseAsJson, parseAsString } from 'nuqs/server';
import * as z from 'zod';

const filtersSchema = z.record(z.string(), z.array(z.string()));

export const searchParsers = {
  q: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  sort: parseAsString.withDefault('name-ASC').withOptions({ clearOnDefault: false }),
  filters: parseAsJson<Record<string, string[]>>(filtersSchema.parse).withDefault({}),
};

export const searchParamsCache = createSearchParamsCache(searchParsers);

export const sortMap: Record<string, { name?: 'ASC' | 'DESC'; price?: 'ASC' | 'DESC' }> = {
  'name-ASC': { name: 'ASC' },
  'name-DESC': { name: 'DESC' },
  'price-ASC': { price: 'ASC' },
  'price-DESC': { price: 'DESC' },
};

export function resolveSearchSort(term: string, sortKey: string, hasExplicitSort: boolean) {
  if (term.trim().length === 0) {
    return sortMap[sortKey] ?? { name: 'ASC' };
  }

  if (sortKey === 'relevance') {
    return undefined;
  }

  if (hasExplicitSort) {
    return sortMap[sortKey] ?? { name: 'ASC' };
  }

  return undefined;
}

export const PER_PAGE = 24;
