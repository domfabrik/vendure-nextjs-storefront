'use server';

import * as z from 'zod';
import type { PaymentMethod, ShippingMethod } from '@/shared/model';

import { apiClient, sessionRequest } from '../api-client';
import { GET_ELIGIBLE_PAYMENT_METHODS, GET_ELIGIBLE_SHIPPING_METHODS, PREPARE_LEAD_ORDER, SUBMIT_LEAD_ORDER } from './queries';

export async function getEligibleShippingMethods(): Promise<ShippingMethod[]> {
  const data = await apiClient.request<{ eligibleShippingMethods: ShippingMethod[] }>(GET_ELIGIBLE_SHIPPING_METHODS);
  return data.eligibleShippingMethods;
}

export async function getEligiblePaymentMethods(): Promise<PaymentMethod[]> {
  const data = await apiClient.request<{ eligiblePaymentMethods: PaymentMethod[] }>(GET_ELIGIBLE_PAYMENT_METHODS);
  return data.eligiblePaymentMethods;
}

export interface SubmitOrderItem {
  productVariantId: string;
  quantity: number;
}

export interface SubmitOrderInput {
  sessionCapability: string;
  submissionToken: string;
  items: SubmitOrderItem[];
  contact: {
    fullName: string;
    phone: string;
  };
}

export interface LeadOrderLine {
  productVariantId: string;
  quantity: number;
  unitPriceWithTax: number;
  linePriceWithTax: number;
}

export interface LeadOrderReceipt {
  orderId: string;
  code: string;
  currencyCode: string;
  totalWithTax: number;
  lines: LeadOrderLine[];
}

export type PrepareLeadOrderResult = { success: true; sessionCapability: string } | { success: false };
export type SubmitLeadOrderResult = { success: true; receipt: LeadOrderReceipt } | { success: false; disposition: 'restart' | 'retry' };

const capabilitySchema = z.string().regex(/^[0-9a-f]{64}$/);
const receiptSchema = z.object({
  orderId: z.union([z.string().min(1), z.number().int().nonnegative()]).transform(String),
  code: z.string().min(1),
  currencyCode: z.string().regex(/^[A-Z]{3}$/),
  totalWithTax: z.number().int().nonnegative(),
  lines: z
    .array(
      z.object({
        productVariantId: z.union([z.string().min(1), z.number().int().nonnegative()]).transform(String),
        quantity: z.number().int().positive(),
        unitPriceWithTax: z.number().int().nonnegative(),
        linePriceWithTax: z.number().int().nonnegative(),
      }),
    )
    .min(1),
});

const definiteFailureCodes = new Set(['LEAD_INVALID_INPUT', 'LEAD_ITEMS_UNAVAILABLE', 'LEAD_CART_NOT_EDITABLE', 'LEAD_CANNOT_FINALIZE']);

function graphqlLeadCode(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('response' in error)) return null;
  const response = (error as { response?: { errors?: Array<{ message?: unknown }> } }).response;
  const message = response?.errors?.[0]?.message;
  return typeof message === 'string' && /^LEAD_[A-Z_]+$/.test(message) ? message : null;
}

export async function prepareLeadOrder(): Promise<PrepareLeadOrderResult> {
  try {
    const result = await sessionRequest<{ prepareLeadOrder: { sessionCapability: string } }>(PREPARE_LEAD_ORDER);
    const parsed = capabilitySchema.safeParse(result.prepareLeadOrder.sessionCapability);
    return parsed.success ? { success: true, sessionCapability: parsed.data } : { success: false };
  } catch {
    return { success: false };
  }
}

export async function submitLeadOrder(input: SubmitOrderInput): Promise<SubmitLeadOrderResult> {
  try {
    const result = await sessionRequest<{ submitLeadOrder: unknown }>(SUBMIT_LEAD_ORDER, { input });
    const parsed = receiptSchema.safeParse(result.submitLeadOrder);
    if (!parsed.success) return { success: false, disposition: 'retry' };
    const submittedQuantities = new Map(input.items.map((item) => [String(item.productVariantId), item.quantity]));
    const receiptMatchesPayload =
      parsed.data.lines.length === submittedQuantities.size && parsed.data.lines.every((line) => submittedQuantities.get(line.productVariantId) === line.quantity);
    return receiptMatchesPayload ? { success: true, receipt: parsed.data } : { success: false, disposition: 'retry' };
  } catch (error) {
    const code = graphqlLeadCode(error);
    return { success: false, disposition: code && definiteFailureCodes.has(code) ? 'restart' : 'retry' };
  }
}
