import { CreditCard } from 'lucide-react';

import { Stack } from '@/src/components/atoms/Stack';
import { TP } from '@/src/components/atoms/TypoGraphy';
import { PaymentType } from '@/src/graphql/selectors';

const PAYMENT_STATES: Record<string, string> = { Authorized: 'Авторизована', Settled: 'Подтверждена', Declined: 'Отклонена' };

interface Props {
  payment?: PaymentType;
}

const validPaymentStates = ['Authorized', 'Settled', 'Declined'] as const;
//TODO: Add all possible payment states

export const OrderPaymentState = ({ payment }: Props) => {
  if (!payment) return null;

  return (
    <Stack
      column
      gap="0.75rem"
    >
      <Stack
        gap="0.5rem"
        itemsCenter
      >
        <CreditCard size={20} />
        {validPaymentStates.includes(payment.state as (typeof validPaymentStates)[number]) && (
          <TP
            weight={500}
            size="1rem"
          >
            {PAYMENT_STATES[payment.state as (typeof validPaymentStates)[number]] || (payment.state as (typeof validPaymentStates)[number])}
          </TP>
        )}
      </Stack>
    </Stack>
  );
};
