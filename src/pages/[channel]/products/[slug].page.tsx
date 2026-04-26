import React from 'react';
import { InferGetServerSidePropsType } from 'next';

import { getServerSideProps } from '@/src/components/pages/products/props';
import { ProductPage } from '@/src/components/pages/products';

const Page: React.FC<InferGetServerSidePropsType<typeof getServerSideProps>> = props => <ProductPage {...props} />;

export { getServerSideProps };
export default Page;
