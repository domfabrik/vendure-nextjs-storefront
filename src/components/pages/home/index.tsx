import styled from '@emotion/styled';
import { InferGetServerSidePropsType } from 'next';

import { ContentContainer, Stack } from '@/src/components/atoms';
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
