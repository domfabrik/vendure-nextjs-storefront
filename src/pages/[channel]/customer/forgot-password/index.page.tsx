import { InferGetServerSidePropsType } from 'next';

import { ForgotPasswordPage } from '@/src/components/pages/customer/forgot-password';
import { getServerSideProps } from '@/src/components/pages/customer/forgot-password/props';

const Page = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => <ForgotPasswordPage {...props} />;

export { getServerSideProps };
export default Page;
