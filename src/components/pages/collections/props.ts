import { GetServerSidePropsContext } from 'next';

import { SSGQuery } from '@/src/graphql/client';
import { CollectionSelector, SearchSelector } from '@/src/graphql/selectors';
import { getCollections } from '@/src/graphql/sharedQueries';
import { makeServerSideProps } from '@/src/lib/getStatic';
import { PER_PAGE, reduceFacets } from '@/src/state/collection/utils';
import { arrayToTree } from '@/src/util/arrayToTree';
import { SortOrder } from '@/src/zeus';

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { slug } = context.params || {};
  const slugArr = Array.isArray(slug) ? slug : slug ? [slug] : [];
  const lastIndexSlug = slugArr.length ? slugArr[slugArr.length - 1] : '';

  const r = await makeServerSideProps(['common', 'collections'])(context);
  const collections = await getCollections(r.context);
  const navigation = arrayToTree(collections);
  const api = SSGQuery(r.context);

  const { collection } = await api({
    collection: [{ slug: lastIndexSlug }, CollectionSelector],
  });
  if (!collection) return { notFound: true as const };

  const productsQuery = await api({
    search: [
      {
        input: {
          collectionSlug: lastIndexSlug,
          groupByProduct: true,
          take: PER_PAGE,
          sort: { name: SortOrder.ASC },
        },
      },
      SearchSelector,
    ],
  });
  const facets = reduceFacets(productsQuery.search.facetValues);

  return {
    props: {
      ...r.props,
      ...r.context,
      slug: slugArr,
      collections: collections,
      name: collections.find((c) => c.slug === lastIndexSlug)?.name,
      products: productsQuery.search?.items,
      facets,
      totalProducts: productsQuery.search?.totalItems,
      collection,
      navigation,
    },
  };
};
