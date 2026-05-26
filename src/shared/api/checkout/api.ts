'use server';

import { apiClient } from '../api-client';
import { GET_ELIGIBLE_PAYMENT_METHODS, GET_ELIGIBLE_SHIPPING_METHODS, type PaymentMethod, type ShippingMethod } from './model';

export async function getEligibleShippingMethods(): Promise<ShippingMethod[]> {
  const data = await apiClient.request<{ eligibleShippingMethods: ShippingMethod[] }>(GET_ELIGIBLE_SHIPPING_METHODS);
  return data.eligibleShippingMethods;
}

export async function getEligiblePaymentMethods(): Promise<PaymentMethod[]> {
  const data = await apiClient.request<{ eligiblePaymentMethods: PaymentMethod[] }>(GET_ELIGIBLE_PAYMENT_METHODS);
  return data.eligiblePaymentMethods;
}
