import { GetServerSidePropsContext } from 'next';

import { SSGQuery } from '@/src/graphql/client';
import { homePageSlidersSelector, ProductDetailSelector } from '@/src/graphql/selectors';
import { getCollections } from '@/src/graphql/sharedQueries';
import { makeServerSideProps } from '@/src/lib/getStatic';
import { arrayToTree } from '@/src/util/arrayToTree';

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const r = await makeServerSideProps(['common', 'products'])(context);
  const language = r.context?.locale || 'ru';
  const { slug } = context.params || {};
  const api = SSGQuery(r.context);

  const response =
    typeof slug === 'string'
      ? await api({
          product: [{ slug }, ProductDetailSelector],
        })
      : null;

  if (!response?.product) return { notFound: true as const };

  const collections = await getCollections(r.context);
  const navigation = arrayToTree(collections);
  const fallbackCollectionSlug = response.product.collections[0]?.slug || 'electronics';

  const relatedProducts = await api({
    collection: [{ slug: fallbackCollectionSlug }, homePageSlidersSelector],
  });
  const clientsAlsoBought = await api({
    collection: [{ slug: fallbackCollectionSlug }, homePageSlidersSelector],
  });

  const { optionGroups: _optionGroups, ...product } = response.product;

  const optionGroups = _optionGroups.map((og) => {
    return {
      ...og,
      options: og.options
        .sort((a, b) => a.name.length - b.name.length || a.name.localeCompare(b.name))
        .map((o) => {
          const name = notInDemoStore.find((v) => v.name.toLowerCase() === o.code.toLowerCase())?.code || o.name;
          return { ...o, name };
        }),
    };
  });

  return {
    props: {
      ...r.props,
      ...r.context,
      slug: context.params?.slug,
      product: {
        ...product,
        optionGroups,
      },
      collections,
      relatedProducts,
      clientsAlsoBought,
      navigation,
      language,
    },
  };
};

//THIS IS NOT IN DEMO STORE - BUT MAKE SENSE TO KEEP IT LIKE THIS
const notInDemoStore = [
  { name: 'blue', code: '#0000FF' },
  { name: 'pink', code: '#FFC0CB' },
  { name: 'black', code: '#000000' },
  { name: 'gray', code: '#808080' },
  { name: 'brown', code: '#964B00' },
  { name: 'wood', code: '#A1662F' },
  { name: 'yellow', code: '#FFFF00' },
  { name: 'green', code: '#008000' },
  { name: 'white', code: '#FFFFFF' },
  { name: 'red', code: '#FF0000' },
  { name: 'mustard', code: '#FFDB58' },
  { name: 'mint', code: '#98FF98' },
  { name: 'pearl', code: '#FDEEF4' },
];
