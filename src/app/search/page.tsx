import type { Metadata } from 'next';
import { searchProducts } from '@/shared/api';
import { SITE_NAME } from '@/shared/config';
import { SearchPage } from './search-page';
import { PER_PAGE, searchParamsCache, sortMap } from './search-params';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function buildFacetValueFilters(filters: Record<string, string[]>) {
  return Object.values(filters)
    .filter((ids) => ids.length > 0)
    .map((ids) => (ids.length === 1 ? { and: ids[0] } : { or: ids }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { q } = await searchParamsCache.parse(props.searchParams);
  const title = q ? `Поиск: «${q}» | ${SITE_NAME}` : `Поиск товаров | ${SITE_NAME}`;

  return {
    title,
  };
}

export default async function Page(props: PageProps) {
  const { q, page, sort: sortKey, filters } = await searchParamsCache.parse(props.searchParams);
  const sort = sortMap[sortKey] ?? { name: 'ASC' };
  const facetValueFilters = buildFacetValueFilters(filters);
  const hasFilters = facetValueFilters.length > 0;

  if (q.length < 1 && !hasFilters) {
    return (
      <SearchPage
        initialData={null}
        allFacetValues={[]}
      />
    );
  }

  const baseQuery = {
    ...(q.length > 0 ? { term: q } : {}),
    sort,
  };

  const [initialData, facetData] = await Promise.all([
    searchProducts({
      ...baseQuery,
      take: PER_PAGE,
      skip: (page - 1) * PER_PAGE,
      facetValueFilters: hasFilters ? facetValueFilters : undefined,
    }),
    hasFilters ? searchProducts({ ...baseQuery, take: 0, skip: 0 }) : null,
  ]);

  return (
    <SearchPage
      initialData={initialData}
      allFacetValues={(facetData ?? initialData).facetValues}
    />
  );
}
