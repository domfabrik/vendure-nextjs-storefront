import type { InferGetStaticPropsType } from 'next';

import { Redirect } from '@/src/lib/redirect';
import Page, { getStaticProps } from '@/src/pages/[channel]/about/index.page';

export default (props: InferGetStaticPropsType<typeof getStaticProps>) => {
  return Redirect({ children: <Page {...props} /> })();
};

export { getStaticProps };
