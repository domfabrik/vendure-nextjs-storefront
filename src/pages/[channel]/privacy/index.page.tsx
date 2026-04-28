import type { InferGetServerSidePropsType } from 'next';

import { getServerSideProps } from '@/src/components/pages/home/props';
import { Privacy } from '@/src/components/pages/privacy';

const Page = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => <Privacy {...props} />;

export { getServerSideProps };
export default Page;
