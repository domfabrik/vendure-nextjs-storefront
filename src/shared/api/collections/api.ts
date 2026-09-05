'use server';

import { cache } from 'react';
import { arrayToTree, type RootNode } from '@/shared/lib';
import type { Collection, CollectionTile, CollectionTileProductVariant, HomepageCollection, HomepageProduct, NavigationCollection } from '@/shared/model';

import { apiClient } from '../api-client';
import { GET_ALL_COLLECTIONS, GET_COLLECTION_BY_SLUG, GET_COLLECTION_PRODUCT_VARIANTS, SEARCH_COLLECTION_PRODUCTS } from './queries';
import { CATALOG_REQUEST_TIMEOUT_MS, loadSecondaryCollections, reportCatalogFailure } from './ssr-budget';

const COLLECTION_PAGE_SIZE = 100;

interface CollectionSearchResponse {
  search: {
    totalItems: number;
    items: HomepageProduct[];
  };
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  const data = await apiClient.request<{ collection: Collection | null }>(GET_COLLECTION_BY_SLUG, { slug });
  return data.collection;
}

// React cache is scoped to the server render, sharing the result with Header.
const loadAllCollections = cache(async (): Promise<CollectionTile[]> => {
  try {
    const data = await apiClient.request<{ collections: { items: CollectionTile[] } }>({
      document: GET_ALL_COLLECTIONS,
      signal: AbortSignal.timeout(CATALOG_REQUEST_TIMEOUT_MS),
    });
    return data.collections.items;
  } catch (error) {
    reportCatalogFailure('GetAllCollections', null, error);
    // Critical failure must keep HTTP 5xx, without leaking the GraphQL payload.
    throw new Error('Catalogue unavailable');
  }
});

export async function getAllCollections(): Promise<CollectionTile[]> {
  return loadAllCollections();
}

export async function getNavigationTree(): Promise<RootNode<NavigationCollection>> {
  const collections = await getAllCollections();

  let enriched: NavigationCollection[];
  try {
    const results = await Promise.all(
      collections.map((c) =>
        apiClient.request<{
          collection: {
            id: string;
            productVariants: { totalItems: number; items: CollectionTileProductVariant[] };
          } | null;
        }>(GET_COLLECTION_PRODUCT_VARIANTS, { slug: c.slug }),
      ),
    );

    enriched = collections.map((c) => {
      const match = results.find((r) => r.collection?.id === c.id);
      return { ...c, productVariants: match?.collection?.productVariants };
    });
  } catch {
    enriched = collections;
  }

  return arrayToTree(enriched);
}

export async function getProductsByCollection(collectionSlug: string, take?: number): Promise<HomepageProduct[]> {
  if (take != null) {
    const data = await apiClient.request<CollectionSearchResponse>(SEARCH_COLLECTION_PRODUCTS, { collectionSlug, take });
    return data.search.items;
  }

  const firstPage = await apiClient.request<CollectionSearchResponse>(SEARCH_COLLECTION_PRODUCTS, {
    collectionSlug,
    take: COLLECTION_PAGE_SIZE,
    skip: 0,
  });

  const products = [...firstPage.search.items];
  const { totalItems } = firstPage.search;

  for (let skip = products.length; skip < totalItems; skip += COLLECTION_PAGE_SIZE) {
    const page = await apiClient.request<CollectionSearchResponse>(SEARCH_COLLECTION_PRODUCTS, {
      collectionSlug,
      take: COLLECTION_PAGE_SIZE,
      skip,
    });
    products.push(...page.search.items);
  }

  return products;
}

export async function getCollectionsWithProducts(take = 6): Promise<HomepageCollection[]> {
  const collections = await getAllCollections();
  const results = await loadSecondaryCollections(
    collections,
    (collection, signal) => apiClient.request<CollectionSearchResponse>({ document: SEARCH_COLLECTION_PRODUCTS, variables: { collectionSlug: collection.slug, take }, signal }),
    (collection) => collection.slug,
  );
  return collections
    .map((c, i) => ({
      name: c.name,
      slug: c.slug,
      totalItems: results[i]?.search.totalItems ?? 0,
      products: results[i]?.search.items ?? [],
      unavailable: results[i] === null,
    }))
    .filter((c) => c.unavailable || c.products.length > 0);
}
