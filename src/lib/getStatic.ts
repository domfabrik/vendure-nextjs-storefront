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

const getStandardLocalePaths = () => {
  return getAllPossibleWithChannels();
};

export const localizeGetStaticPaths = <T>(
  existingPaths: Array<{
    params: T;
  }>,
) => {
  const allPaths = getAllPossibleWithChannels();
  return allPaths.flatMap((locale) =>
    existingPaths.map((ep) => ({
      ...ep,
      params: { ...ep.params, ...locale.params },
    })),
  );
};

export async function getI18nProps(_ctx: ContextModel, _ns: string[] = ['common']) {
  return {};
}

export function makeStaticProps(ns: string[]) {
  return async function getStaticProps(ctx: ContextModel) {
    const context = getContext(ctx);
    return {
      props: await getI18nProps(context, ns),
      context: context.params,
    };
  };
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

export const getStaticPaths = () => ({
  fallback: false,
  paths: getStandardLocalePaths(),
});
