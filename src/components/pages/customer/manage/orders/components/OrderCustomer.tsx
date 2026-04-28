import { Mail, Phone, User } from 'lucide-react';

import { Stack, TP } from '@/src/components';

interface OrderCustomerProps {
  customer?: {
    firstName?: string;
    lastName?: string;
    emailAddress?: string;
    phoneNumber?: string;
  };
}

export const OrderCustomer = ({ customer }: OrderCustomerProps) => {
  return (
    <Stack
      column
      gap="2rem"
    >
      {(customer?.firstName || customer?.lastName) && (
        <Stack
          column
          gap="0.5rem"
        >
          <Stack
            gap="0.5rem"
            itemsCenter
          >
            <User size={'1.6rem'} />
            <TP
              size="1.25rem"
              weight={500}
            >
              {'Имя покупателя'}
            </TP>
          </Stack>
          <TP>
            {customer?.firstName} {customer?.lastName}
          </TP>
        </Stack>
      )}
      <Stack gap="2.5rem">
        <Stack
          column
          gap="0.5rem"
        >
          <Stack
            gap="0.5rem"
            itemsCenter
          >
            <Mail size={'1.6rem'} />
            <TP
              size="1.25rem"
              weight={500}
            >
              {'Email'}
            </TP>
          </Stack>
          <TP>{customer?.emailAddress}</TP>
        </Stack>
        {customer?.phoneNumber ? (
          <Stack
            column
            gap="0.5rem"
          >
            <Stack
              gap="0.5rem"
              itemsCenter
            >
              <Phone size={'1.6rem'} />
              <TP
                size="1.25rem"
                weight={500}
              >
                {'Телефон'}
              </TP>
            </Stack>
            <TP>{customer?.phoneNumber}</TP>
          </Stack>
        ) : null}
      </Stack>
    </Stack>
  );
};
