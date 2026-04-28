import styled from '@emotion/styled';
import { X } from 'lucide-react';

import { Stack } from '@/src/components/atoms/Stack';
import { TH2, TP } from '@/src/components/atoms/TypoGraphy';
import { IconButton } from '@/src/components/molecules/Button';
import { ActiveOrderType } from '@/src/graphql/selectors';
import { useCart } from '@/src/state/cart';

interface Props {
  activeOrder?: ActiveOrderType;
}

export const CartHeader = ({ activeOrder }: Props) => {
  const { close } = useCart();
  return (
    <CartHeaderWrapper
      justifyBetween
      itemsCenter
    >
      <Stack
        itemsEnd
        gap="1rem"
      >
        <TH2>{'Ваша корзина'}</TH2>
        {activeOrder?.totalQuantity ? (
          <TP style={{ marginBottom: '0.5rem' }}>
            ({activeOrder?.lines.length} {'товаров'})
          </TP>
        ) : null}
      </Stack>
      <IconButton onClick={close}>
        <X />
      </IconButton>
    </CartHeaderWrapper>
  );
};

const CartHeaderWrapper = styled(Stack)`
    padding: 1.5rem 2rem;
    border-bottom: 1px solid ${(p) => p.theme.gray(100)};
`;
