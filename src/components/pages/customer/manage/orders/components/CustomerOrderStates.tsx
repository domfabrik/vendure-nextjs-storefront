import { Stack } from '@/src/components/atoms/Stack';
import { TP, TypoGraphy } from '@/src/components/atoms/TypoGraphy';

interface Props {
  state: string;
}

const states = ['Payment', 'Shipped', 'Delivered'];

export const CustomerOrderStatus = ({ state }: Props) => {
  const _state = states.includes(state) ? state : states[0];
  return (
    <Stack itemsStart>
      {states.map((s) =>
        _state.includes(s) ? (
          <Stack
            column
            key={s}
            gap="0.25rem"
          >
            <TypoGraphy
              size="2rem"
              weight={500}
            >
              {'Статус заказа'}
            </TypoGraphy>
            <TP>{s}</TP>
          </Stack>
        ) : null,
      )}
    </Stack>
  );
};
