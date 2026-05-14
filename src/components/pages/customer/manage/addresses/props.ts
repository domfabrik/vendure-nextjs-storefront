import { GetServerSidePropsContext } from 'next';
import { SSRQuery } from '@/src/graphql/client';
import { ActiveCustomerSelector } from '@/src/graphql/selectors';
import { getCollections } from '@/src/graphql/sharedQueries';
import { makeServerSideProps } from '@/src/lib/getStatic';
import { prepareSSRRedirect } from '@/src/lib/redirect';
import { arrayToTree } from '@/src/util/arrayToTree';

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const r = await makeServerSideProps(['common', 'customer'])();

  const collections = await getCollections();
  const navigation = arrayToTree(collections);
  const homePageRedirect = prepareSSRRedirect('/')(context);

  try {
    const { activeCustomer } = await SSRQuery(context)({
      activeCustomer: ActiveCustomerSelector,
    });
    if (!activeCustomer) throw new Error('No active customer');

    const returnedStuff = {
      ...r.props,
      ...r.context,
      collections,
      activeCustomer,
      navigation,
    };

    return { props: returnedStuff };
  } catch (_error) {
    return homePageRedirect;
  }
};
