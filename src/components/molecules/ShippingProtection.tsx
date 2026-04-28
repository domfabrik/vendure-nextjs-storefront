import styled from '@emotion/styled';
import { BoxIcon } from 'lucide-react';

import { Stack, TP } from '@/src/components/atoms';
import { priceFormatter } from '@/src/util/priceFormatter';
import { CurrencyCode } from '@/src/zeus';

export const ShippingProtection = ({ value, active, onClick, currencyCode }: { value: number; active: boolean; onClick: (value: boolean) => void; currencyCode: CurrencyCode }) => {
  return (
    <Stack
      itemsCenter
      justifyBetween
    >
      <Stack
        gap="1.75rem"
        itemsCenter
      >
        <BoxIcon size={24} />
        <Stack column>
          <TP
            size="1.5rem"
            weight={500}
          >
            {'Защита доставки'}
          </TP>
          <TP
            size="1.25rem"
            weight={400}
          >
            От повреждений, потери и кражи за <span>{priceFormatter(value, currencyCode)}</span>
          </TP>
        </Stack>
      </Stack>
      <Switch onClick={() => onClick(!active)}>
        <Toggle active={active} />
      </Switch>
    </Stack>
  );
};

const Switch = styled.div`
    position: relative;
    width: 4.2rem;
    height: 2.2rem;
    padding: 0.4rem;

    display: flex;
    justify-content: center;
    border-radius: ${(p) => p.theme.borderRadius};

    border: 1px solid ${(p) => p.theme.gray(1000)};

    cursor: pointer;
`;

const Toggle = styled.div<{ active: boolean }>`
    position: absolute;
    width: 1.4rem;
    height: 1.2rem;
    background: ${(p) => p.theme.gray(1000)};
    transform: ${(p) => (p.active ? 'translateX(0.8rem)' : 'translateX(-0.8rem)')};
    transition: transform 0.4s ease-in-out;
`;
