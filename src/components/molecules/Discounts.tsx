import styled from '@emotion/styled';
import { X } from 'lucide-react';

import { Price, Stack, TP } from '@/src/components/atoms';
import { DiscountsType } from '@/src/graphql/selectors';
import { CurrencyCode } from '@/src/zeus';

interface Props {
  discounts: DiscountsType[] | undefined;
  currencyCode: CurrencyCode;
  withLabel?: boolean;
  removeCouponCode?: (code: string) => void;
}

export const Discounts = ({ discounts, removeCouponCode, currencyCode, withLabel }: Props) => {
  if (!discounts || discounts.length === 0) return null;
  return (
    <Stack column>
      {withLabel && (
        <TP
          size="1.5rem"
          weight={500}
        >
          {'Скидка'}
        </TP>
      )}
      {discounts.map((discount) => (
        <Stack
          key={discount.description}
          justifyBetween
        >
          <Stack
            itemsCenter
            gap="0.25rem"
          >
            {removeCouponCode && (
              <Remove onClick={() => removeCouponCode(discount.description)}>
                <X size={'1.4rem'} />
              </Remove>
            )}
            <TP size="1.5rem">
              {'Код:'} {discount.description}
            </TP>
          </Stack>
          <Price
            price={discount.amountWithTax}
            currencyCode={currencyCode}
          />
        </Stack>
      ))}
    </Stack>
  );
};

const Remove = styled.button`
    width: 1.4rem;
    height: 1.4rem;
    appearance: none;
    border: none;
    background: transparent;

    display: flex;
    align-items: center;
    justify-content: center;

    gap: 0.4rem;
`;
