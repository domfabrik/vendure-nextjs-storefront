// import { useCart } from '@/src/state/cart';

import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'motion/react';

import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Stack } from '@/src/components/atoms';
import { Button } from './Button';

export const NotifyMeForm = () => {
  const schema = z.object({ email: z.string().email('Введите корректный email') });
  //get own mutation to add customer to notify list
  // const { myAddToNotifyList } = useCart();
  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
  } = useForm<{ email: string }>({
    resolver: zodResolver(schema),
  });
  const onSubmit: SubmitHandler<{ email: string }> = async () => {
    // perform own logic to add customer to notify list
    // try {
    //     const data = await myAddToNotifyList(email);
    //     if (data) {
    //          added to notify list
    //     } else {
    //         setError('code', { message: "Не удалось подписаться, попробуйте позже" });
    //     }
    // } catch (error) {
    //     setError('code', { message: "Что-то пошло не так" });
    // }

    reset();
  };

  return (
    <Stack
      column
      style={{ position: 'relative' }}
    >
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Stack style={{ height: '100%' }}>
          <Input
            {...register('email', { required: true })}
            placeholder={'Уведомить меня'}
          />
          <StyledButton type="submit">{'Отправить'}</StyledButton>
        </Stack>
      </Form>
      <FormError
        style={{ margin: 0 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: errors.email?.message ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {errors.email?.message}
      </FormError>
    </Stack>
  );
};

const StyledButton = styled(Button)`
    padding-block: 0.75rem;
`;

const Input = styled.input`
    appearance: none;
    outline: none;

    padding: 0.2rem 1rem;
    border: 1px solid ${(p) => p.theme.gray(100)};
`;

const Form = styled.form`
    display: flex;
    align-items: center;
`;

const FormError = styled(motion.div)`
    position: absolute;
    top: 100%;
    left: 0;
    color: ${(p) => p.theme.error};
    font-size: 1.2rem;
    font-weight: 500;
    min-height: 1.8rem;
    margin: 0.4rem 0 0.8rem 0;
`;
