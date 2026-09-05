'use server';

import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { buildCollectionBreadcrumbJsonLd, buildCollectionItemListJsonLd, generateCollectionMetadata } from '@/entities/collection/index.server';
import { getCollectionBySlug, searchProducts } from '@/shared/api';
import { envServer } from '@/shared/config/index.server';
import { CollectionPage } from './collection-page';
import { buildCollectionPageHref, collectionParamsCache, PER_PAGE, parseCollectionPage, sortMap, withoutPage } from './collection-params';

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
  if (!collection) notFound();
  const searchParams = await props.searchParams;
  const parsedPage = parseCollectionPage(searchParams);
  if (parsedPage.status === 'invalid') permanentRedirect(buildCollectionPageHref(slug, 1, searchParams));
  if (parsedPage.status === 'above-range') notFound();
  const { page } = parsedPage;

  const isCleanPagination = Object.keys(searchParams).every((key) => key === 'page');
  return generateCollectionMetadata(collection, slug, page, isCleanPagination);
}

export default async function Page(props: PageProps) {
  const { slug } = await props.params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();
  const searchParams = await props.searchParams;
  const parsedPage = parseCollectionPage(searchParams);
  if (parsedPage.status === 'invalid') permanentRedirect(buildCollectionPageHref(slug, 1, searchParams));
  if (parsedPage.status === 'above-range') notFound();
  const { page } = parsedPage;
  const { sort: sortKey, filters } = await collectionParamsCache.parse(searchParams);
  const sort = sortMap[sortKey] ?? { name: 'ASC' };
  const facetValueFilters = buildFacetValueFilters(filters);
  const hasFilters = facetValueFilters.length > 0;

  const baseQuery = { collectionSlug: slug, sort };

  const [initialData, facetData] = await Promise.all([
    searchProducts({
      ...baseQuery,
      take: PER_PAGE,
      skip: (page - 1) * PER_PAGE,
      facetValueFilters: hasFilters ? facetValueFilters : undefined,
    }),
    hasFilters ? searchProducts({ ...baseQuery, take: 0, skip: 0 }) : null,
  ]);

  const totalPages = Math.ceil(initialData.totalItems / PER_PAGE);
  if (page > Math.max(totalPages, 1)) notFound();

  const breadcrumbJsonLd = buildCollectionBreadcrumbJsonLd(collection, envServer.SITE_URL, slug);
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
      paginationSearchParams={withoutPage(searchParams)}
      slug={slug}
    />
  );
}
