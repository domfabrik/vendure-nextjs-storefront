import type { InferGetStaticPropsType } from 'next';

import { getStaticProps } from '@/src/components/pages/home/props';
import { Terms } from '@/src/components/pages/terms';
import { getStaticPaths } from '@/src/lib/getStatic';

const Page = (props: InferGetStaticPropsType<typeof getStaticProps>) => <Terms {...props} />;

export { getStaticPaths, getStaticProps };
export default Page;
