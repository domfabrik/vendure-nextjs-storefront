'use server';

import type { PaymentMethod, ShippingMethod } from '@/shared/model';

import { apiClient } from '../api-client';
import { GET_ELIGIBLE_PAYMENT_METHODS, GET_ELIGIBLE_SHIPPING_METHODS } from './queries';

export async function getEligibleShippingMethods(): Promise<ShippingMethod[]> {
  const data = await apiClient.request<{ eligibleShippingMethods: ShippingMethod[] }>(GET_ELIGIBLE_SHIPPING_METHODS);
  return data.eligibleShippingMethods;
}

export async function getEligiblePaymentMethods(): Promise<PaymentMethod[]> {
  const data = await apiClient.request<{ eligiblePaymentMethods: PaymentMethod[] }>(GET_ELIGIBLE_PAYMENT_METHODS);
  return data.eligiblePaymentMethods;
}
