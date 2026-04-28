import { zodResolver } from '@hookform/resolvers/zod';
import { InferGetServerSidePropsType } from 'next';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { ContentContainer } from '@/src/components/atoms/ContentContainer';
import { Link } from '@/src/components/atoms/Link';
import { Stack } from '@/src/components/atoms/Stack';
import { TP } from '@/src/components/atoms/TypoGraphy';
import { Banner, Input } from '@/src/components/forms';
import { Button } from '@/src/components/molecules/Button';
import { storefrontApiMutation } from '@/src/graphql/client';
import { RegisterCustomerInputType } from '@/src/graphql/selectors';
import { Layout } from '@/src/layouts';
import { usePush } from '@/src/lib/redirect';
import { useChannels } from '@/src/state/channels';
import { Absolute, Form, FormContainer, FormContent, FormWrapper } from '../components/shared';
import { getServerSideProps } from './props';

type FormValues = RegisterCustomerInputType & { confirmPassword: string };

export const SignUpPage = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const ctx = useChannels();
  const { t } = useTranslation('customer');
  const { t: tErrors } = useTranslation('common');
  const [success, setSuccess] = useState<boolean>(false);
  const push = usePush();
  const schema = z
    .object({
      emailAddress: z.string().email(tErrors('errors.email.invalid')).min(1, tErrors('errors.email.required')),
      password: z.string().min(8, tErrors('errors.password.minLength')).max(25, tErrors('errors.password.maxLength')),
      confirmPassword: z.string().min(8, tErrors('errors.password.minLength')).max(25, tErrors('errors.password.maxLength')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: tErrors('errors.confirmPassword.mustMatch'),
      path: ['confirmPassword'],
    });

  const {
    formState: { errors, isSubmitting },
    register,
    handleSubmit,
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const { emailAddress, password } = data;

    try {
      const { registerCustomerAccount } = await storefrontApiMutation(ctx)({
        registerCustomerAccount: [
          { input: { emailAddress, password } },
          {
            __typename: true,
            '...on Success': { success: true },
            '...on MissingPasswordError': {
              message: true,
              errorCode: true,
            },
            '...on NativeAuthStrategyError': {
              message: true,
              errorCode: true,
            },
            '...on PasswordValidationError': {
              errorCode: true,
              message: true,
              validationErrorMessage: true,
            },
          },
        ],
      });

      if (registerCustomerAccount.__typename === 'Success') {
        setSuccess(true);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        push('/customer/sign-in');
        return;
      }

      setError('root', { message: tErrors(`errors.backend.${registerCustomerAccount.errorCode}`) });
    } catch {
      setError('root', { message: tErrors('errors.backend.UNKNOWN_ERROR') });
    }
  };

  return (
    <Layout
      categories={props.collections}
      navigation={props.navigation}
      pageTitle={t('signUpTitle')}
    >
      <ContentContainer>
        <FormContainer>
          <FormWrapper
            column
            itemsCenter
            gap="3.5rem"
          >
            {success && (
              <Absolute w100>
                <Banner success={{ message: t('signUpSuccess') }} />
              </Absolute>
            )}
            <Absolute w100>
              <Banner
                error={errors.root}
                clearErrors={() => setError('root', { message: undefined })}
              />
            </Absolute>
            <TP weight={600}>{t('signUpTitle')}</TP>
            <FormContent
              w100
              column
              itemsCenter
              gap="1.75rem"
            >
              <Form onSubmit={handleSubmit(onSubmit)}>
                <Input
                  error={errors.emailAddress}
                  label={t('email')}
                  type="text"
                  {...register('emailAddress')}
                />
                <Input
                  error={errors.password}
                  label={t('password')}
                  type="password"
                  {...register('password')}
                />
                <Input
                  error={errors.confirmPassword}
                  label={t('confirmPassword')}
                  type="password"
                  {...register('confirmPassword')}
                />
                <Button
                  loading={isSubmitting}
                  type="submit"
                >
                  {t('signUp')}
                </Button>
              </Form>

              <Stack
                column
                itemsCenter
                gap="0.5rem"
              >
                <Link href="/customer/forgot-password">{t('forgotPassword')}</Link>
                <Link href="/customer/sign-in">{t('signIn')}</Link>
              </Stack>
            </FormContent>
          </FormWrapper>
        </FormContainer>
      </ContentContainer>
    </Layout>
  );
};
