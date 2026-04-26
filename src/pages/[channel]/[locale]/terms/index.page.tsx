import React from 'react';
import type { InferGetServerSidePropsType } from 'next';
import { Terms } from '@/src/components/pages/terms';
import { getServerSideProps } from '@/src/components/pages/home/props';

const Page: React.FC<InferGetServerSidePropsType<typeof getServerSideProps>> = props => <Terms {...props} />;

export { getServerSideProps };
export default Page;
