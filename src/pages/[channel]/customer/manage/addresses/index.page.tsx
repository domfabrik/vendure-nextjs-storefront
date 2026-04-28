import { InferGetServerSidePropsType } from 'next';

import { AddressesPage } from '@/src/components/pages/customer/manage/addresses';
import { getServerSideProps } from '@/src/components/pages/customer/manage/addresses/props';

const Page = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => <AddressesPage {...props} />;

export { getServerSideProps };
export default Page;
