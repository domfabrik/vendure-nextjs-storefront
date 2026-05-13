import { GetServerSidePropsContext } from 'next';
import { getContext } from './utils';

export interface ContextModel<T = Record<string, string>> {
  params: { locale: string; channel: string } & T;
}

export async function getI18nProps(_ctx: ContextModel, _ns: string[] = ['common']) {
  return {};
}

export function makeServerSideProps(ns: string[]) {
  return async function getServerSideProps(ctx: GetServerSidePropsContext) {
    const context = getContext(ctx);
    return {
      props: await getI18nProps(context, ns),
      context: context.params,
    };
  };
}
