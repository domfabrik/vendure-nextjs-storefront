import { InferGetStaticPropsType } from 'next';

import CollectionPage from '@/src/components/pages/collections';
import { getStaticPaths } from '@/src/components/pages/collections/paths';
import { getStaticProps } from '@/src/components/pages/collections/props';

const Page = (props: InferGetStaticPropsType<typeof getStaticProps>) => <CollectionPage {...props} />;

export { getStaticPaths, getStaticProps };
export default Page;
