import CollectionPage from '@/src/components/pages/collections';
import { getServerSideProps } from '@/src/components/pages/collections/props';

import { InferGetServerSidePropsType } from 'next';
import React from 'react';

const Page: React.FC<InferGetServerSidePropsType<typeof getServerSideProps>> = props => <CollectionPage {...props} />;

export { getServerSideProps };
export default Page;
