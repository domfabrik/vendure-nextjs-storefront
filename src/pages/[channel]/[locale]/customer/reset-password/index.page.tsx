import { InferGetServerSidePropsType } from 'next';

import { ResetPasswordPage } from '@/src/components/pages/customer/reset-password';
import { getServerSideProps } from '@/src/components/pages/customer/reset-password/props';

const Page = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => <ResetPasswordPage {...props} />;
export { getServerSideProps };
export default Page;
