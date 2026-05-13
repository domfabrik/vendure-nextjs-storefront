import type { InferGetServerSidePropsType } from 'next';

import Page, { getServerSideProps } from '@/src/pages/[channel]/customer/forgot-password/index.page';

export default (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return <Page {...props} />;
};

export { getServerSideProps };
