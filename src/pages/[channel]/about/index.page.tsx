import type { InferGetStaticPropsType } from 'next';

import { About } from '@/src/components/pages/about';
import { getStaticProps } from '@/src/components/pages/home/props';
import { getStaticPaths } from '@/src/lib/getStatic';

const Page = (props: InferGetStaticPropsType<typeof getStaticProps>) => <About {...props} />;

export { getStaticPaths, getStaticProps };
export default Page;
