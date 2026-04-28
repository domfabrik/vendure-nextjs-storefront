import type { InferGetServerSidePropsType } from 'next';

import { Home } from '@/src/components/pages/home';
import { getServerSideProps } from '@/src/components/pages/home/props';

const Page = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => <Home {...props} />;

export { getServerSideProps };
export default Page;
