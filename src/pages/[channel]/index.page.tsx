import type { InferGetStaticPropsType } from 'next';

import { Home } from '@/src/components/pages/home';
import { getStaticProps } from '@/src/components/pages/home/props';
import { getStaticPaths } from '@/src/lib/getStatic';

const Page = (props: InferGetStaticPropsType<typeof getStaticProps>) => <Home {...props} />;

export { getStaticPaths, getStaticProps };
export default Page;
