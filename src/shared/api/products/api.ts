'use server';

import type { CollectionSlider, HomepageProduct, Product, SearchResult } from '@/shared/model';

import { apiClient } from '../api-client';
import { getAllCollections, getProductsByCollection } from '../collections';
import { GET_FEATURED_PRODUCTS, GET_PRODUCT_BY_SLUG, GET_PRODUCT_SLIDERS } from './queries';

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const data = await apiClient.request<{ product: Product | null }>(GET_PRODUCT_BY_SLUG, { slug });
  return data.product;
}

export async function getFeaturedProducts(take = 4): Promise<SearchResult[]> {
  const data = await apiClient.request<{ search: { items: SearchResult[] } }>(GET_FEATURED_PRODUCTS, { take });
  return data.search.items;
}

export async function getNewProducts(perCollection = 2): Promise<HomepageProduct[]> {
  const collections = await getAllCollections();
  const results = await Promise.all(collections.map((c) => getProductsByCollection(c.slug, perCollection)));
  const seen = new Set<string>();
  return results.flat().filter((p) => {
    if (seen.has(p.slug)) return false;
    seen.add(p.slug);
    return true;
  });
}

export async function getProductSliders(collectionSlugs: string[]): Promise<CollectionSlider[]> {
  const responses = await Promise.all(collectionSlugs.map((slug) => apiClient.request<{ collection: CollectionSlider | null }>(GET_PRODUCT_SLIDERS, { slug })));
  return responses.map((res) => res.collection).filter((c): c is CollectionSlider => c !== null);
}
