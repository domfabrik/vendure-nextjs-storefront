import { GetServerSidePropsContext } from 'next';
import { SSRQuery } from '@/src/graphql/client';
import { ActiveCustomerSelector, ActiveOrderSelector, OrderAddressSelector } from '@/src/graphql/selectors';
import { getCollections } from '@/src/graphql/sharedQueries';
import { makeServerSideProps } from '@/src/lib/getStatic';
import { prepareSSRRedirect, redirectFromDefaultChannelSSR } from '@/src/lib/redirect';
import { arrayToTree } from '@/src/util/arrayToTree';

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const r = await makeServerSideProps(['common', 'customer'])(context);
  const translationRedirect = redirectFromDefaultChannelSSR(context);
  if (translationRedirect) return translationRedirect;

  const collections = await getCollections(r.context);
  const navigation = arrayToTree(collections);
  const homePageRedirect = prepareSSRRedirect('/')(context);
  const code = context.params?.code as string;

  try {
    const { activeCustomer } = await SSRQuery(context)({
      activeCustomer: {
        ...ActiveCustomerSelector,
        orders: [
          { options: { filter: { code: { eq: code } } } },
          {
            items: {
              ...ActiveOrderSelector,
              billingAddress: OrderAddressSelector,
              shippingAddress: OrderAddressSelector,
            },
          },
        ],
      },
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
