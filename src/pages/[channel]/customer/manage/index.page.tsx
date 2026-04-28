import { InferGetServerSidePropsType } from 'next';

import { ManageAccountPage } from '@/src/components/pages/customer/manage';
import { getServerSideProps } from '@/src/components/pages/customer/manage/props';

const Page = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => <ManageAccountPage {...props} />;

export { getServerSideProps };
export default Page;
