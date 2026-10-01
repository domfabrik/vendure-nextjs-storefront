import { unstable_cache } from 'next/cache';

import { getAllCollections, getCollectionsWithProducts, getProductsByCollection } from './api';

const REVALIDATE_24H = 86_400;
const CACHE_TAG = 'homepage';

export const getCachedAllCollections = unstable_cache(getAllCollections, ['homepage-all-collections'], {
  revalidate: REVALIDATE_24H,
  tags: [CACHE_TAG],
});

export const getCachedCollectionsWithProducts = unstable_cache(getCollectionsWithProducts, ['homepage-collections-with-products'], {
  revalidate: REVALIDATE_24H,
  tags: [CACHE_TAG],
});

export const getCachedProductsByCollection = unstable_cache(getProductsByCollection, ['homepage-products-by-collection'], {
  revalidate: REVALIDATE_24H,
  tags: [CACHE_TAG],
});
