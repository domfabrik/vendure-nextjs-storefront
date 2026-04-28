import { InferGetServerSidePropsType } from 'next';

import { ProductPage } from '@/src/components/pages/products';
import { getServerSideProps } from '@/src/components/pages/products/props';

const Page = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => <ProductPage {...props} />;

export { getServerSideProps };
export default Page;
