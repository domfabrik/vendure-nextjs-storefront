import styled from '@emotion/styled';
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
import { Layout } from '@/src/layouts';
import { useChannels } from '@/src/state/channels';
import { Absolute, Form, FormContainer, FormContent, FormWrapper } from '../components/shared';
import { getServerSideProps } from './props';

type FormValues = {
  emailAddress: string;
};

export const ForgotPasswordPage = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const ctx = useChannels();
  const { t } = useTranslation('customer');
  const { t: tErrors } = useTranslation('common');
  const [success, setSuccess] = useState<string>();

  const schema = z.object({
    emailAddress: z.string().email(tErrors('errors.email.invalid')).min(1, tErrors('errors.email.required')),
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<{ emailAddress: string }> = async (data) => {
    const { emailAddress } = data;
    try {
      const { requestPasswordReset } = await storefrontApiMutation(ctx)({
        requestPasswordReset: [
          { emailAddress },
          {
            __typename: true,
            '...on Success': {
              success: true,
            },
            '...on NativeAuthStrategyError': {
              errorCode: true,
              message: true,
            },
          },
        ],
      });

      if (!requestPasswordReset) {
        setError('root', { message: tErrors(`errors.backend.UNKNOWN_ERROR`) });

        return;
      }

      if (requestPasswordReset?.__typename === 'Success') {
        setSuccess(t('forgotPasswordSuccess'));
        return;
      }

      setError('root', { message: tErrors(`errors.backend.${requestPasswordReset.errorCode}`) });
    } catch {
      setError('root', { message: tErrors(`errors.backend.UNKNOWN_ERROR`) });
    }
  };

  return (
    <Layout
      categories={props.collections}
      navigation={props.navigation}
      pageTitle={t('forgotPasswordTitle')}
    >
      <ContentContainer>
        <FormContainer>
          <FormWrapper
            column
            itemsCenter
            gap="3.5rem"
          >
            <Absolute w100>
              <Banner
                error={errors.root}
                success={success ? { message: success } : undefined}
                clearErrors={() => {
                  setError('root', { message: undefined });
                  setSuccess(undefined);
                }}
              />
            </Absolute>
            <TP weight={600}>{t('forgotPasswordTitle')}</TP>
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
                <Button
                  loading={isSubmitting}
                  type="submit"
                >
                  {t('newPassword')}
                </Button>
              </Form>
              <Stack
                column
                itemsCenter
                gap="0.5rem"
              >
                <StyledLink href="/customer/sign-in">{t('signIn')}</StyledLink>
                <StyledLink href="/customer/sign-up">{t('signUp')}</StyledLink>
              </Stack>
            </FormContent>
          </FormWrapper>
        </FormContainer>
      </ContentContainer>
    </Layout>
  );
};

const StyledLink = styled(Link)`
    position: relative;
    color: ${({ theme }) => theme.text.main};
    display: block;
    transition: text-decoration 0.3s ease;

    &:hover {
        text-decoration: underline;
    }
`;
