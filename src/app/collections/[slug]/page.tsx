'use server';

import type { Metadata } from 'next';
import { buildCollectionBreadcrumbJsonLd, buildCollectionItemListJsonLd, generateCollectionMetadata } from '@/entities/collection';
import { getCollectionBySlug, searchProducts } from '@/shared/api';
import { envServer } from '@/shared/config';
import { CollectionPage } from './collection-page';
import { collectionParamsCache, PER_PAGE, sortMap } from './collection-params';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function buildFacetValueFilters(filters: Record<string, string[]>) {
  return Object.values(filters)
    .filter((ids) => ids.length > 0)
    .map((ids) => (ids.length === 1 ? { and: ids[0] } : { or: ids }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return {};

  return generateCollectionMetadata(collection, slug);
}

export default async function Page(props: PageProps) {
  const { slug } = await props.params;
  const { page, sort: sortKey, filters } = await collectionParamsCache.parse(props.searchParams);
  const sort = sortMap[sortKey] ?? { name: 'ASC' };
  const facetValueFilters = buildFacetValueFilters(filters);
  const hasFilters = facetValueFilters.length > 0;

  const baseQuery = { collectionSlug: slug, sort };

  const [collection, initialData, facetData] = await Promise.all([
    getCollectionBySlug(slug),
    searchProducts({
      ...baseQuery,
      take: PER_PAGE,
      skip: (page - 1) * PER_PAGE,
      facetValueFilters: hasFilters ? facetValueFilters : undefined,
    }),
    hasFilters ? searchProducts({ ...baseQuery, take: 0, skip: 0 }) : null,
  ]);

  const breadcrumbJsonLd = collection ? buildCollectionBreadcrumbJsonLd(collection, envServer.SITE_URL, slug) : null;
  const itemListJsonLd = buildCollectionItemListJsonLd(initialData.items, envServer.SITE_URL);

  const jsonLdScripts = (
    <>
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
    </>
  );

  return (
    <CollectionPage
      collectionName={collection?.name ?? ''}
      initialData={initialData}
      allFacetValues={(facetData ?? initialData).facetValues}
      jsonLdScripts={jsonLdScripts}
    />
  );
}
