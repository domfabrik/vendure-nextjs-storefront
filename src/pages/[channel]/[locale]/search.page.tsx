import { InferGetServerSidePropsType } from 'next';

import { SearchPage } from '@/src/components/pages/search';
import { getServerSideProps } from '@/src/components/pages/search/props';

const Page = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => <SearchPage {...props} />;

export { getServerSideProps };
export default Page;
