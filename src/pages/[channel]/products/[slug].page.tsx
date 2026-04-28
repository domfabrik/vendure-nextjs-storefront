import { InferGetStaticPropsType } from 'next';

import { ProductPage } from '@/src/components/pages/products';
import { getStaticPaths } from '@/src/components/pages/products/paths';
import { getStaticProps } from '@/src/components/pages/products/props';

const Page = (props: InferGetStaticPropsType<typeof getStaticProps>) => <ProductPage {...props} />;

export { getStaticPaths, getStaticProps };
export default Page;
