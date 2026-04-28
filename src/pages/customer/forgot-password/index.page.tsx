import type { InferGetServerSidePropsType } from 'next';

import { Redirect } from '@/src/lib/redirect';
import Page, { getServerSideProps } from '@/src/pages/[channel]/customer/forgot-password/index.page';

export default (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return Redirect({ children: <Page {...props} /> })();
};

export { getServerSideProps };
