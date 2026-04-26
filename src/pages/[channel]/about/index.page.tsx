import React from 'react';
import type { InferGetServerSidePropsType } from 'next';
import { About } from '@/src/components/pages/about';
import { getServerSideProps } from '@/src/components/pages/home/props';

const Page: React.FC<InferGetServerSidePropsType<typeof getServerSideProps>> = props => <About {...props} />;

export { getServerSideProps };
export default Page;
