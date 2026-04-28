import { GetServerSidePropsContext } from 'next';
import { channels } from './consts';
import { getContext } from './utils';

export interface ContextModel<T = Record<string, string>> {
  params: { locale: string; channel: string } & T;
}

export const getAllPossibleWithChannels = () => {
  const paths: { params: { locale: string; channel: string } }[] = [];
  channels.forEach((c) => {
    if (c.locales.length === 0) {
      paths.push({ params: { channel: c.slug, locale: c.nationalLocale } });
    } else {
      c.locales
        .filter((l) => l !== c.nationalLocale)
        .forEach((locale) => {
          paths.push({ params: { channel: c.slug, locale } });
        });
    }
  });
  return paths;
};

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
