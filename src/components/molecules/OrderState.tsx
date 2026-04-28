import styled from '@emotion/styled';
import { useTranslation } from 'next-i18next';

import { Stack, TP } from '@/src/components/atoms';
import { OrderStateType } from '@/src/graphql/selectors';
import { orderStateToIcon } from '@/src/util/orderStateToIcon';

interface Props {
  state: string;
  size?: 'small' | 'medium' | 'large';
  column?: boolean;
  withoutText?: boolean;
  itemsCenter?: boolean;
  itemsEnd?: boolean;
}

export const OrderState = ({ state, size = 'small', column, withoutText, itemsCenter, itemsEnd = true }: Props) => {
  const { t } = useTranslation('common');
  const iconSize = size === 'small' ? 20 : size === 'medium' ? 30 : 40;
  return (
    <Stack
      w100
      itemsEnd={itemsEnd}
      itemsCenter={itemsCenter}
      gap="0.5rem"
      column={column}
    >
      <Stack
        justifyCenter
        itemsCenter
      >
        {orderStateToIcon(state, iconSize)}
      </Stack>
      {!withoutText && (
        <StyledTP
          v={size}
          weight={500}
        >
          {t(`orderStates.${state as OrderStateType}`)}
        </StyledTP>
      )}
    </Stack>
  );
};

const StyledTP = styled(TP)<{ v: Props['size'] }>`
    font-size: ${(p) => (p.v === 'small' ? '1rem' : p.v === 'medium' ? '1.25rem' : '1.5rem')};
    font-weight: 500;
`;
