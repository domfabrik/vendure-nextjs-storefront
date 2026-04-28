import styled from '@emotion/styled';
import { PropsWithChildren } from 'react';
import { Stack, TypoGraphy } from '@/src/components';

interface PopularSearchesProps extends PropsWithChildren {
  popularSearches: string[];
  onClick: (item: string) => void;
}

export const PopularSearches = ({ children, popularSearches, onClick }: PopularSearchesProps) => {
  return (
    <Stack
      column
      gap="1rem"
    >
      {children}
      <PopularSearchesWrapper gap="1rem">
        {popularSearches?.map((item) => (
          <TypoGraphy
            key={item}
            size={'1.5rem'}
            weight={400}
            onClick={() => onClick(item)}
            style={{ cursor: 'pointer' }}
          >
            {item}
          </TypoGraphy>
        ))}
      </PopularSearchesWrapper>
    </Stack>
  );
};

const PopularSearchesWrapper = styled(Stack)`
    flex-direction: row;

    @media (min-width: ${(p) => p.theme.breakpoints.lg}) {
        flex-direction: column;
    }
`;
