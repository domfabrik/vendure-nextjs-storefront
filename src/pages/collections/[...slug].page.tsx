import type { InferGetStaticPropsType } from 'next';

import { Redirect } from '@/src/lib/redirect';
import Page, { getStaticPaths, getStaticProps } from '@/src/pages/[channel]/collections/[...slug].page';

export default (props: InferGetStaticPropsType<typeof getStaticProps>) => {
  return Redirect({ children: <Page {...props} /> })();
};

export { getStaticProps, getStaticPaths };
