import type { InferGetStaticPropsType } from 'next';

import { getStaticPaths } from '@/src/components/pages/products/paths';
import { getStaticProps } from '@/src/components/pages/products/props';
import { Redirect } from '@/src/lib/redirect';
import Page from '@/src/pages/[channel]/products/[slug].page';

export default (props: InferGetStaticPropsType<typeof getStaticProps>) => {
  return Redirect({ children: <Page {...props} /> })();
};

export { getStaticPaths, getStaticProps };
