import { InferGetServerSidePropsType } from 'next';

import { CheckoutPage } from '@/src/components/pages/checkout';
import { getServerSideProps } from '@/src/components/pages/checkout/props';

export const Page = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => <CheckoutPage {...props} />;

export { getServerSideProps };
export default Page;
