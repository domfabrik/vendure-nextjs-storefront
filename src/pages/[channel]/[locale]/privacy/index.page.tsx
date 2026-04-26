import React from 'react';
import type { InferGetServerSidePropsType } from 'next';
import { Privacy } from '@/src/components/pages/privacy';
import { getServerSideProps } from '@/src/components/pages/home/props';

const Page: React.FC<InferGetServerSidePropsType<typeof getServerSideProps>> = props => <Privacy {...props} />;

export { getServerSideProps };
export default Page;
