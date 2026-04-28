import { InferGetServerSidePropsType } from 'next';

import { SignInPage } from '@/src/components/pages/customer/sign-in';
import { getServerSideProps } from '@/src/components/pages/customer/sign-in/props';

const Page = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => <SignInPage {...props} />;

export { getServerSideProps };
export default Page;
