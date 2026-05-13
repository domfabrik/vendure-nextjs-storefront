import { GetServerSidePropsContext } from 'next';
import { Url } from 'next/dist/shared/lib/router/router';
import { useRouter } from 'next/router';
import { useCallback } from 'react';

interface TransitionOptions {
  shallow?: boolean;
  scroll?: boolean;
  unstable_skipClientCache?: boolean;
}

export const usePush = () => {
  const router = useRouter();

  return useCallback(
    (to?: string, as?: Url, options?: TransitionOptions) => {
      const channel = router.query.channel ? `/${router.query.channel}` : '';
      const locale = router.query.locale ? `/${router.query.locale}` : '';
      router.push(`${channel}${locale}${to}`, as, options);
    },
    [router.query],
  );
};

export const prepareSSRRedirect = (where: string) => (ctx: GetServerSidePropsContext) => {
  const channel = ctx.params?.channel ? `/${ctx.params.channel}` : '';
  const locale = ctx.params?.locale ? `/${ctx.params.locale}` : '';

  const destination = `${channel}${locale}${where}`;
  return { redirect: { destination, permanent: false } };
};
