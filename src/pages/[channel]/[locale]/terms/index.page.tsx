import type { InferGetServerSidePropsType } from 'next';

import { getServerSideProps } from '@/src/components/pages/home/props';
import { Terms } from '@/src/components/pages/terms';

const Page = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => <Terms {...props} />;

export { getServerSideProps };
export default Page;
