import { InferGetServerSidePropsType } from 'next';

import CollectionPage from '@/src/components/pages/collections';
import { getServerSideProps } from '@/src/components/pages/collections/props';

const Page = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => <CollectionPage {...props} />;

export { getServerSideProps };
export default Page;
