import { createSearchParamsCache, parseAsInteger, parseAsJson, parseAsString } from 'nuqs/server';
import * as z from 'zod';

export type CollectionSearchParams = Record<string, string | string[] | undefined>;

const filtersSchema = z.record(z.string(), z.array(z.string()));

export const collectionParsers = {
  page: parseAsInteger.withDefault(1),
  sort: parseAsString.withDefault('name-ASC'),
  filters: parseAsJson<Record<string, string[]>>(filtersSchema.parse).withDefault({}),
};

export const collectionParamsCache = createSearchParamsCache(collectionParsers);

export const sortMap: Record<string, { name?: 'ASC' | 'DESC'; price?: 'ASC' | 'DESC' }> = {
  'name-ASC': { name: 'ASC' },
  'name-DESC': { name: 'DESC' },
  'price-ASC': { price: 'ASC' },
  'price-DESC': { price: 'DESC' },
};

export const PER_PAGE = 24;
export const MAX_COLLECTION_PAGE = Math.ceil(2_147_483_647 / PER_PAGE);

export type ParsedCollectionPage = { status: 'valid'; page: number } | { status: 'invalid' } | { status: 'above-range' };

export function parseCollectionPage(searchParams: CollectionSearchParams): ParsedCollectionPage {
  const rawPage = searchParams.page;
  if (rawPage === undefined) return { status: 'valid', page: 1 };
  if (Array.isArray(rawPage) || !/^[1-9]\d*$/.test(rawPage)) return { status: 'invalid' };

  const maxPage = String(MAX_COLLECTION_PAGE);
  if (rawPage.length > maxPage.length || (rawPage.length === maxPage.length && rawPage > maxPage)) {
    return { status: 'above-range' };
  }

  return { status: 'valid', page: Number(rawPage) };
}

export function withoutPage(searchParams: CollectionSearchParams): CollectionSearchParams {
  return Object.fromEntries(Object.entries(searchParams).filter(([key, value]) => key !== 'page' && value !== undefined));
}

export function buildCollectionPageHref(slug: string, page: number, searchParams: CollectionSearchParams): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(withoutPage(searchParams))) {
    if (Array.isArray(value)) {
      for (const item of value) query.append(key, item);
    } else if (value !== undefined) {
      query.set(key, value);
    }
  }

  if (page > 1) query.set('page', String(page));
  const serialized = query.toString();
  return `/collections/${encodeURIComponent(slug)}${serialized ? `?${serialized}` : ''}`;
}
