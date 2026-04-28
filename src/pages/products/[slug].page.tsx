import type { InferGetServerSidePropsType } from 'next';

import { getServerSideProps } from '@/src/components/pages/products/props';
import { Redirect } from '@/src/lib/redirect';
import Page from '@/src/pages/[channel]/products/[slug].page';

export default (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return Redirect({ children: <Page {...props} /> })();
};

export { getServerSideProps };
