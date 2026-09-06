import type { Metadata } from 'next';
import { searchProducts } from '@/shared/api';
import { SITE_NAME } from '@/shared/config';
import { SearchPage } from './search-page';
import { PER_PAGE, resolveSearchSort, searchParamsCache } from './search-params';

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
    robots: { index: false, follow: true },
  };
}

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  const { q, page, sort: sortKey, filters } = await searchParamsCache.parse(searchParams);
  const term = q.trim();
  const sort = resolveSearchSort(term, sortKey, searchParams.sort !== undefined);
  const facetValueFilters = buildFacetValueFilters(filters);
  const hasFilters = facetValueFilters.length > 0;

  if (term.length < 1 && !hasFilters) {
    return (
      <SearchPage
        initialData={null}
        allFacetValues={[]}
        defaultSortIsRelevance={false}
      />
    );
  }

  const baseQuery = {
    ...(term.length > 0 ? { term } : {}),
    ...(sort ? { sort } : {}),
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
      defaultSortIsRelevance={term.length > 0 && searchParams.sort === undefined}
    />
  );
}
