import type { InferGetServerSidePropsType } from 'next';

import Page, { getServerSideProps } from '@/src/pages/[channel]/customer/sign-up/index.page';

export default (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return <Page {...props} />;
};

export { getServerSideProps };
