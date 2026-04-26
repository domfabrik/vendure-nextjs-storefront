import React from 'react';
import type { InferGetServerSidePropsType } from 'next';

import { Home } from '@/src/components/pages/home';
import { getServerSideProps } from '@/src/components/pages/home/props';

const Page: React.FC<InferGetServerSidePropsType<typeof getServerSideProps>> = props => <Home {...props} />;

export { getServerSideProps };
export default Page;
