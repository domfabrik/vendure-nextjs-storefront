import styled from '@emotion/styled';

import { Stack, TP } from '@/src/components/atoms';
import { OrderStateType } from '@/src/graphql/selectors';
import { orderStateToIcon } from '@/src/util/orderStateToIcon';

const ORDER_STATES: Record<string, string> = {
  Created: 'Создан',
  Draft: 'Черновик',
  AddingItems: 'Добавление товаров',
  Cancelled: 'Отменён',
  ArrangingPayment: 'Ожидание оплаты',
  PaymentAuthorized: 'Оплата авторизована',
  PaymentSettled: 'Оплата подтверждена',
  PartiallyShipped: 'Частично отправлен',
  Shipped: 'Отправлен',
  PartiallyDelivered: 'Частично доставлен',
  Delivered: 'Доставлен',
  Modifying: 'Изменение',
  ArrangingAdditionalPayment: 'Дополнительная оплата',
};

interface Props {
  state: string;
  size?: 'small' | 'medium' | 'large';
  column?: boolean;
  withoutText?: boolean;
  itemsCenter?: boolean;
  itemsEnd?: boolean;
}

export const OrderState = ({ state, size = 'small', column, withoutText, itemsCenter, itemsEnd = true }: Props) => {
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
          {ORDER_STATES[state as OrderStateType] || (state as OrderStateType)}
        </StyledTP>
      )}
    </Stack>
  );
};

const StyledTP = styled(TP)<{ v: Props['size'] }>`
    font-size: ${(p) => (p.v === 'small' ? '1rem' : p.v === 'medium' ? '1.25rem' : '1.5rem')};
    font-weight: 500;
`;
