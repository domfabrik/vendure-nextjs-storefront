import styled from '@emotion/styled';

import { Stack, TH2 } from '@/src/components/atoms';
import { CollectionTileType } from '@/src/graphql/selectors';

interface MainBarProps {
  title: string;
  categories: CollectionTileType[];
}

export const MainBar = ({ title }: MainBarProps) => {
  return (
    <Main
      w100
      itemsCenter
      justifyBetween
      gap="2rem"
    >
      <Title>{title}</Title>
    </Main>
  );
};

const Title = styled(TH2)`
    flex: 1;
`;

const Main = styled(Stack)`
    @media (max-width: ${(p) => p.theme.breakpoints.md}) {
        flex-direction: column;
        align-items: flex-start;
    }
`;
