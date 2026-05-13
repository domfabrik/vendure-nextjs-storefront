import type { InferGetServerSidePropsType } from 'next';

import { getServerSideProps } from '@/src/components/pages/products/props';
import Page from '@/src/pages/[channel]/products/[slug].page';

export default (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return <Page {...props} />;
};

export { getServerSideProps };
