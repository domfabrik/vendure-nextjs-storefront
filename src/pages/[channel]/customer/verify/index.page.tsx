import { InferGetServerSidePropsType } from 'next';

import { VerifyPage } from '@/src/components/pages/customer/verify';
import { getServerSideProps } from '@/src/components/pages/customer/verify/props';

const Page = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => <VerifyPage {...props} />;

export { getServerSideProps };
export default Page;
