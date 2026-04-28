import styled from '@emotion/styled';
import { InferGetServerSidePropsType } from 'next';

import { ContentContainer, Stack } from '@/src/components/atoms';
import { Hero } from '@/src/components/organisms/Hero';
import { HomePageSliders } from '@/src/components/organisms/HomePageSliders';
import { Layout } from '@/src/layouts';
import type { getServerSideProps } from './props';

const Main = styled(Stack)`
    padding: 0 0 4rem 0;
`;

export const Home = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return (
    <Layout
      navigation={props.navigation}
      categories={props.categories}
      pageTitle={'Главная'}
    >
      <Main
        w100
        column
        gap="4rem"
      >
        <Hero
          cta={'смотреть все'}
          h1={'Лучшие товары для зимы'}
          h2={'Почувствуйте волшебство праздников'}
          desc={'Акции на подарки и другие товары'}
          link="/collections/home-garden"
          image={props.products?.find((p) => p.slug.includes('laptop'))?.productAsset?.preview ?? (props.products[0]?.productAsset?.preview || '')}
        />
        <ContentContainer>
          <HomePageSliders
            sliders={props.sliders}
            seeAllText={'Смотреть все'}
          />
        </ContentContainer>
      </Main>
    </Layout>
  );
};
