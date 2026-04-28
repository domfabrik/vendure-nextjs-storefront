import type { InferGetStaticPropsType } from 'next';

import { getStaticProps } from '@/src/components/pages/home/props';
import { Privacy } from '@/src/components/pages/privacy';
import { getStaticPaths } from '@/src/lib/getStatic';

const Page = (props: InferGetStaticPropsType<typeof getStaticProps>) => <Privacy {...props} />;

export { getStaticPaths, getStaticProps };
export default Page;
