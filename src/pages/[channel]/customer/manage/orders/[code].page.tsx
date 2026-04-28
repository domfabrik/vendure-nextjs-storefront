import { InferGetServerSidePropsType } from 'next';

import { OrderPage } from '@/src/components/pages/customer/manage/orders/order';
import { getServerSideProps } from '@/src/components/pages/customer/manage/orders/order/props';

const Page = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => <OrderPage {...props} />;

export { getServerSideProps };
export default Page;
