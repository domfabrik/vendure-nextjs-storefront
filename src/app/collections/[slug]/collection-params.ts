import { createSearchParamsCache, parseAsInteger, parseAsJson, parseAsString } from 'nuqs/server';
import * as z from 'zod';

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
