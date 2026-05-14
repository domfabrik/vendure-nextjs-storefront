import { PackageCheck } from 'lucide-react';

import { Price, Stack, TP } from '@/src/components';
import { ShippingLineType } from '@/src/graphql/selectors';

interface OrderShippingStatusProps {
  label: string;
  shipping?: ShippingLineType;
}

export const OrderShippingStatus = ({ shipping, label }: OrderShippingStatusProps) => {
  if (!shipping) return null;
  return (
    <Stack
      column
      gap="0.5rem"
    >
      <Stack
        gap="0.25rem"
        itemsCenter
      >
        <PackageCheck size={'1.6rem'} />
        <TP
          size="1.25rem"
          weight={500}
        >
          {label}
        </TP>
      </Stack>
      <Stack itemsCenter>
        <Price price={shipping?.priceWithTax} />
        <TP>&nbsp;- {shipping?.shippingMethod.name}</TP>
      </Stack>
    </Stack>
  );
};
