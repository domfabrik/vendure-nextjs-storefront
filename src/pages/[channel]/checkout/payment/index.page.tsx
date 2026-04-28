import { InferGetServerSidePropsType } from 'next';

import { PaymentPage } from '@/src/components/pages/checkout/payment';
import { getServerSideProps } from '@/src/components/pages/checkout/payment/props';

const Page = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => <PaymentPage {...props} />;

export { getServerSideProps };
export default Page;
