'use server';

import { apiClient } from '../api-client';
import { type CollectionSlider, GET_FEATURED_PRODUCTS, GET_PRODUCT_BY_SLUG, GET_PRODUCT_SLIDERS, type Product, type SearchResult } from './model';

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const data = await apiClient.request<{ product: Product | null }>(GET_PRODUCT_BY_SLUG, { slug });
  return data.product;
}

export async function getFeaturedProducts(take = 4): Promise<SearchResult[]> {
  const data = await apiClient.request<{ search: { items: SearchResult[] } }>(GET_FEATURED_PRODUCTS, { take });
  return data.search.items;
}

export async function getProductSliders(collectionSlugs: string[]): Promise<CollectionSlider[]> {
  const responses = await Promise.all(collectionSlugs.map((slug) => apiClient.request<{ collection: CollectionSlider | null }>(GET_PRODUCT_SLIDERS, { slug })));
  return responses.map((res) => res.collection).filter((c): c is CollectionSlider => c !== null);
}
