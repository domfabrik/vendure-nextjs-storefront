import { GetServerSidePropsContext } from 'next';
import { getCollections } from '@/src/graphql/sharedQueries';
import { makeServerSideProps } from '@/src/lib/getStatic';
import { prepareSSRRedirect } from '@/src/lib/redirect';
import { arrayToTree } from '@/src/util/arrayToTree';

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const r = await makeServerSideProps(['common', 'customer'])();

  const collections = await getCollections();
  const navigation = arrayToTree(collections);
  const token = context.query.token as string;
  const homePageRedirect = prepareSSRRedirect('/')(context);

  if (!token) return homePageRedirect;

  const returnedStuff = {
    ...r.props,
    ...r.context,
    collections,
    token,
    navigation,
  };

  return { props: returnedStuff };
};
