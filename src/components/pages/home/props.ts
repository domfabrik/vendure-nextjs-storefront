import { GetServerSidePropsContext } from 'next';

import { SSGQuery } from '@/src/graphql/client';
import { HomePageSlidersType, homePageSlidersSelector, ProductSearchSelector } from '@/src/graphql/selectors';
import { getCollections } from '@/src/graphql/sharedQueries';
import { makeServerSideProps } from '@/src/lib/getStatic';
import { arrayToTree } from '@/src/util/arrayToTree';
import { SortOrder } from '@/src/zeus';

const slugsOfBestOf = ['home-garden', 'electronics', 'sports-outdoor'];

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const r = await makeServerSideProps(['common', 'homepage'])(ctx);
  const api = SSGQuery(r.context);

  const products = await api({
    search: [{ input: { take: 4, groupByProduct: true, sort: { price: SortOrder.ASC } } }, { items: ProductSearchSelector }],
  });

  const responses = await Promise.all(slugsOfBestOf.map((slug) => api({ collection: [{ slug }, homePageSlidersSelector] })));

  const sliders = responses.map((res) => res.collection).filter((section): section is HomePageSlidersType => !!section);
  const collections = await getCollections(r.context);
  const navigation = arrayToTree(collections);

  return {
    props: {
      ...r.props,
      ...r.context,
      products: products.search.items,
      categories: collections,
      navigation,
      sliders,
    },
  };
};
