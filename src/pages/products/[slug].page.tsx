import Page from '@/src/pages/[channel]/products/[slug].page';
import { Redirect } from '@/src/lib/redirect';
import React from 'react';
import type { InferGetServerSidePropsType } from 'next';
import { getServerSideProps } from '@/src/components/pages/products/props';

export default (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
    return Redirect({ children: <Page {...props} /> })();
};

export { getServerSideProps };
