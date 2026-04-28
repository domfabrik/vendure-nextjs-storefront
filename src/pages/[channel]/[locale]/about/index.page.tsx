import type { InferGetServerSidePropsType } from 'next';

import { About } from '@/src/components/pages/about';
import { getServerSideProps } from '@/src/components/pages/home/props';

const Page = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => <About {...props} />;

export { getServerSideProps };
export default Page;
