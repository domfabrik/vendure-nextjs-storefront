'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { type LeadOrderReceipt, prepareLeadOrder, submitLeadOrder } from '@/shared/api';
import { trackOrderRequestSubmitted } from '@/shared/lib';
import { useCartStore } from '@/shared/store';
import { clearLeadCheckoutAttempt, createLeadCheckoutAttempt, type LeadCheckoutAttempt, loadLeadCheckoutAttempt, saveLeadCheckoutAttempt } from './lead-checkout-attempt';

const checkoutSchema = z.object({
  recipientFullName: z.string().trim().min(2, 'Имя должно содержать минимум 2 символа').max(200, 'Имя слишком длинное'),
  recipientPhoneNumber: z
    .string()
    .min(1, 'Введите номер телефона')
    .max(40, 'Номер телефона слишком длинный')
    .refine((phone) => /^\+?\d{7,15}$/.test(phone.replace(/[\s()-]/g, '')), 'Введите корректный номер телефона'),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  prepareAction?: typeof prepareLeadOrder;
  submitAction?: typeof submitLeadOrder;
}

const RETRY_ERROR = 'Результат отправки пока неизвестен. Повторите попытку с сохранёнными данными заявки.';
const RESTART_ERROR = 'Заявка не была отправлена. Проверьте данные или состав корзины и попробуйте ещё раз.';

function formatReceiptTotal(receipt: LeadOrderReceipt): string {
  try {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: receipt.currencyCode }).format(receipt.totalWithTax / 100);
  } catch {
    return `${(receipt.totalWithTax / 100).toFixed(2)} ${receipt.currencyCode}`;
  }
}

export function CheckoutDialog({ open, onClose, prepareAction = prepareLeadOrder, submitAction = submitLeadOrder }: CheckoutDialogProps) {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const [isPending, setIsPending] = useState(false);
  const [attempt, setAttempt] = useState<LeadCheckoutAttempt | null>(null);
  const [sessionCapability, setSessionCapability] = useState<string | null>(null);
  const [sessionPending, setSessionPending] = useState(false);
  const [receipt, setReceipt] = useState<LeadOrderReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const attemptRef = useRef<LeadCheckoutAttempt | null>(null);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(false);
  const operationRef = useRef(0);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { recipientFullName: '', recipientPhoneNumber: '' },
  });

  const resetDialog = useCallback(() => {
    reset();
    setReceipt(null);
    setError(null);
    setAttempt(null);
    attemptRef.current = null;
    setSessionCapability(null);
  }, [reset]);

  const finishClose = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
    resetDialog();
    onCloseRef.current();
  }, [resetDialog]);

  function handleClose() {
    if (inFlightRef.current) return;
    finishClose();
  }

  useEffect(() => {
    if (!open) return;
    let active = true;
    const recovered = loadLeadCheckoutAttempt();
    if (recovered) {
      attemptRef.current = recovered;
      setAttempt(recovered);
      setSessionCapability(recovered.input.sessionCapability);
      reset({ recipientFullName: recovered.input.contact.fullName, recipientPhoneNumber: recovered.input.contact.phone });
      return () => {
        active = false;
      };
    }

    setSessionPending(true);
    prepareAction()
      .then((result) => {
        if (active && result.success) setSessionCapability(result.sessionCapability);
        else if (active) setError('Не удалось подготовить отправку. Закройте форму и попробуйте ещё раз.');
      })
      .catch(() => {
        if (active) setError('Не удалось подготовить отправку. Закройте форму и попробуйте ещё раз.');
      })
      .finally(() => {
        if (active) setSessionPending(false);
      });
    return () => {
      active = false;
    };
  }, [open, prepareAction, reset]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      operationRef.current += 1;
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    };
  }, []);

  async function onSubmit(data: CheckoutFormData) {
    if (inFlightRef.current || receipt) return;
    const existingAttempt = attemptRef.current;
    if (!existingAttempt && !sessionCapability) {
      setError('Сессия заявки ещё не готова. Подождите и повторите отправку.');
      return;
    }

    const activeAttempt =
      existingAttempt ??
      createLeadCheckoutAttempt({
        sessionCapability: sessionCapability as string,
        items: items.map((item) => ({ productVariantId: item.productVariantId, quantity: item.quantity })),
        contact: { fullName: data.recipientFullName, phone: data.recipientPhoneNumber },
      });
    if (!existingAttempt) {
      attemptRef.current = activeAttempt;
      setAttempt(activeAttempt);
      saveLeadCheckoutAttempt(activeAttempt);
    }

    inFlightRef.current = true;
    const operation = ++operationRef.current;
    const canUpdateUi = () => mountedRef.current && operationRef.current === operation;
    setIsPending(true);
    setError(null);
    try {
      const result = await submitAction(activeAttempt.input);
      if (!result.success) {
        if (result.disposition === 'restart') {
          clearLeadCheckoutAttempt(activeAttempt.input.submissionToken);
          attemptRef.current = null;
          if (canUpdateUi()) {
            setAttempt(null);
            setError(RESTART_ERROR);
          }
        } else if (canUpdateUi()) {
          setError(RETRY_ERROR);
        }
        return;
      }
      clearCart();
      clearLeadCheckoutAttempt(activeAttempt.input.submissionToken);
      attemptRef.current = null;
      trackOrderRequestSubmitted(result.receipt);
      if (canUpdateUi()) {
        setAttempt(null);
        setReceipt(result.receipt);
        closeTimerRef.current = setTimeout(() => {
          if (canUpdateUi()) finishClose();
        }, 2500);
      }
    } catch {
      if (canUpdateUi()) setError(RETRY_ERROR);
    } finally {
      inFlightRef.current = false;
      if (canUpdateUi()) setIsPending(false);
    }
  }

  const frozenAttempt = !!attempt && !receipt;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Оформление заявки</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {receipt && (
            <Alert severity="success">
              Заявка {receipt.code} принята на сумму {formatReceiptTotal(receipt)}. Мы свяжемся с вами для подтверждения.
            </Alert>
          )}
          {error && <Alert severity="error">{error}</Alert>}
          {frozenAttempt && (
            <Alert severity="info">Результат предыдущей отправки неизвестен. Повтор использует те же данные; изменить их можно после подтверждения результата.</Alert>
          )}
          {!receipt && (
            <>
              <TextField
                label="Имя"
                autoFocus
                {...register('recipientFullName')}
                error={!!errors.recipientFullName}
                helperText={errors.recipientFullName?.message}
                disabled={isPending || frozenAttempt}
              />
              <TextField
                label="Телефон"
                {...register('recipientPhoneNumber')}
                error={!!errors.recipientPhoneNumber}
                helperText={errors.recipientPhoneNumber?.message}
                disabled={isPending || frozenAttempt}
              />
              {sessionPending && <Typography color="text.secondary">Подготавливаем отправку…</Typography>}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleClose}
            disabled={isPending}
          >
            {receipt ? 'Закрыть' : 'Отмена'}
          </Button>
          {!receipt && (
            <Button
              type="submit"
              variant="contained"
              disabled={isPending || sessionPending || (!sessionCapability && !attempt)}
            >
              {isPending ? 'Отправка...' : frozenAttempt ? 'Повторить отправку' : 'Отправить заявку'}
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
}
