import { InferGetServerSidePropsType } from 'next';

import { HistoryPage } from '@/src/components/pages/customer/manage/orders';
import { getServerSideProps } from '@/src/components/pages/customer/manage/orders/props';

const Page = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => <HistoryPage {...props} />;

export { getServerSideProps };
export default Page;
