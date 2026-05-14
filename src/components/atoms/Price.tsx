import styled from '@emotion/styled';
import { Stack } from '@/src/components/atoms/Stack';
import { BaseProps, TP } from '@/src/components/atoms/TypoGraphy';
import { priceFormatter } from '@/src/util/priceFormatter';

type PriceProps = {
  price: number;
  discountPrice?: number | null;
  quantity?: number;
} & Partial<BaseProps>;

export const Price = ({ price, discountPrice, quantity = 1, size = '1.5rem', weight = 400 }: PriceProps) => {
  const differentPrices = !!(discountPrice && price * quantity !== discountPrice * quantity);
  return (
    <Stack gap="0.75rem">
      <StyledPrice
        size={size}
        weight={weight}
        discount={differentPrices}
      >
        {priceFormatter(price * quantity)}
      </StyledPrice>
      {differentPrices && (
        <StyledDiscountPrice
          weight={weight}
          size={size}
        >
          {priceFormatter(discountPrice * quantity)}
        </StyledDiscountPrice>
      )}
    </Stack>
  );
};

const StyledPrice = styled(TP)<{ discount?: boolean }>`
    color: ${(p) => p.theme.price.default};
    ${(p) => (p.discount ? `text-decoration: line-through;` : '')}
`;

const StyledDiscountPrice = styled(TP)`
    color: ${(p) => p.theme.price.discount};
`;
