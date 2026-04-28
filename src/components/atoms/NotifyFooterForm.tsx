import styled from '@emotion/styled';
import { SendHorizonal } from 'lucide-react';

import { SubmitHandler, useForm } from 'react-hook-form';

type NotifyForm = { email: string };
export const NotifyFooterForm = () => {
  const { register, handleSubmit } = useForm<NotifyForm>();
  const onSubmit: SubmitHandler<NotifyForm> = (data) => window.alert(`${'Подписка оформлена!'} ${data.email}`);

  return (
    <NotifyWrapper onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('email', {
          required: true,
          pattern: {
            value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
            message: '',
          },
        })}
        type="text"
        placeholder={'email@example.com'}
      />
      <button
        type="submit"
        style={{ display: 'flex', alignItems: 'center' }}
      >
        <SendHorizonal size="2rem" />
      </button>
    </NotifyWrapper>
  );
};

const NotifyWrapper = styled.form`
    display: flex;
    align-items: center;
    width: max-content;
    height: max-content;
    padding: 1rem 1.2rem;
    border: 1px solid ${({ theme }) => theme.gray(500)};
    input {
        border: none;
        outline: none;
    }
    svg {
        color: ${({ theme }) => theme.gray(600)};
        cursor: pointer;
    }
    button {
        background: transparent;
        border: none;
    }
`;
