import { AnimatePresence } from 'motion/react';

import { useState } from 'react';
import { Stack } from '@/src/components/atoms/Stack';
import { TP } from '@/src/components/atoms/TypoGraphy';
import { ActiveCustomerType } from '@/src/graphql/selectors';
import { StyledButton } from './atoms/shared';
import { CustomerDetailsForm } from './forms/CustomerDetailsForm';
import { CustomerResetPasswordForm } from './forms/CustomerResetPasswordForm';

interface Props {
  initialCustomer: ActiveCustomerType;
}

export const CustomerForm = ({ initialCustomer }: Props) => {
  const [view, setView] = useState<'details' | 'password'>('details');
  const handleView = (view: 'details' | 'password') => setView(view);

  return (
    <Stack
      w100
      gap="3.5rem"
      column
    >
      <Stack
        w100
        column
        gap="1.5rem"
      >
        <TP
          size="2.5rem"
          weight={600}
        >
          {'Мой аккаунт'}
        </TP>
        <Stack gap="0.5rem">
          <StyledButton
            active={view === 'details'}
            onClick={() => handleView('details')}
          >
            {'Данные аккаунта'}
          </StyledButton>
          <StyledButton
            active={view === 'password'}
            onClick={() => handleView('password')}
          >
            {'Смена пароля'}
          </StyledButton>
        </Stack>
      </Stack>
      <AnimatePresence>{view === 'details' ? <CustomerDetailsForm initialCustomer={initialCustomer} /> : <CustomerResetPasswordForm />}</AnimatePresence>
    </Stack>
  );
};
