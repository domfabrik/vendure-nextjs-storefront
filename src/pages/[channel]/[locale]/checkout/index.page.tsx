import { InferGetServerSidePropsType } from 'next';

import { getServerSideProps } from '@/src/components/pages/checkout/props';
import CheckoutPage from '@/src/pages/[channel]/checkout/index.page';

export const Page = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => <CheckoutPage {...props} />;

export { getServerSideProps };
export default Page;
