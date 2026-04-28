import { InferGetServerSidePropsType } from 'next';

import { ConfirmationPage } from '@/src/components/pages/checkout/confirmation';
import { getServerSideProps } from '@/src/components/pages/checkout/confirmation/props';

const Page = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => <ConfirmationPage {...props} />;

export default Page;
export { getServerSideProps };
