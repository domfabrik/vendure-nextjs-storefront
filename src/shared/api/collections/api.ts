'use server';

import { arrayToTree, type RootNode } from '@/shared/lib';
import type { Collection, CollectionTile, CollectionTileProductVariant, HomepageCollection, HomepageProduct, NavigationCollection } from '@/shared/model';

import { apiClient } from '../api-client';
import { GET_ALL_COLLECTIONS, GET_COLLECTION_BY_SLUG, GET_COLLECTION_PRODUCT_VARIANTS, SEARCH_COLLECTION_PRODUCTS } from './queries';

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  const data = await apiClient.request<{ collection: Collection | null }>(GET_COLLECTION_BY_SLUG, { slug });
  return data.collection;
}

export async function getAllCollections(): Promise<CollectionTile[]> {
  const data = await apiClient.request<{ collections: { items: CollectionTile[] } }>(GET_ALL_COLLECTIONS);
  return data.collections.items;
}

export async function getNavigationTree(): Promise<RootNode<NavigationCollection>> {
  const tiles = await apiClient.request<{ collections: { items: CollectionTile[] } }>(GET_ALL_COLLECTIONS);
  const collections = tiles.collections.items;

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
  const data = await apiClient.request<{ search: { totalItems: number; items: HomepageProduct[] } }>(SEARCH_COLLECTION_PRODUCTS, { collectionSlug, ...(take != null && { take }) });
  return data.search.items;
}

export async function getCollectionsWithProducts(take = 6): Promise<HomepageCollection[]> {
  const collections = await getAllCollections();
  const results = await Promise.all(
    collections.map((c) => apiClient.request<{ search: { totalItems: number; items: HomepageProduct[] } }>(SEARCH_COLLECTION_PRODUCTS, { collectionSlug: c.slug, take })),
  );
  return collections
    .map((c, i) => ({
      name: c.name,
      slug: c.slug,
      totalItems: results[i].search.totalItems,
      products: results[i].search.items,
    }))
    .filter((c) => c.products.length > 0);
}
