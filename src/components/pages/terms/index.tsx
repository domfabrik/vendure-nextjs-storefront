import styled from '@emotion/styled';
import { InferGetServerSidePropsType } from 'next';

import type { getServerSideProps } from '@/src/components/pages/home/props';
import { Layout } from '@/src/layouts';
import { termsContent } from './terms';

export const Terms = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return (
    <Layout
      navigation={props.navigation}
      categories={props.categories}
      pageTitle={'Главная'}
    >
      <HtmlContentTerms dangerouslySetInnerHTML={{ __html: termsContent }} />
    </Layout>
  );
};

const HtmlContentTerms = styled.section`
    word-wrap: break-word;
    overflow-wrap: break-word;
    margin: auto;
    padding: 6rem 0;
    max-width: 1280px;
    h1 {
        font-size: 4rem;
        margin-bottom: 4rem;
    }
    h2,
    h3 {
        font-size: 2.5rem;
        font-weight: 600;
        line-height: 120%;
        color: #000;
        margin: 4rem 0;
    }
    p,
    span,
    a {
        font-size: 2rem;
        line-height: 150%;
        margin: 1.4rem 0;
        color: #000;
    }
    a:hover {
        color: blue;
    }
    span {
        font-style: italic;
    }
    strong {
        font-size: 2rem;
        line-height: 120%;
        font-weight: 700;
        margin-bottom: 2.4rem;
    }
    li {
        font-size: 2rem;
        line-height: 150%;
        color: #000;
        list-style: inside;
        margin: 0.4rem 0;
    }
    ul {
        margin-bottom: 2.4rem;
    }
    @media (max-width: 1200px) {
        h1 {
            font-size: 3.2rem;
        }
        h2,
        h3 {
            font-size: 2rem;
            margin-bottom: 2.4rem;
            margin-top: 4rem;
        }
        p,
        a {
            font-size: 1.6rem;
            margin-bottom: 2.4rem;
        }
        li {
            font-size: 1.6rem;
        }
        strong {
            font-size: 1.6rem;
        }
    }
`;
