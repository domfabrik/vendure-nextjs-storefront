import { resolveMetrikaConfig } from './metrika-config';

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    ym?: (...args: unknown[]) => void;
  }
}

function getMetrikaId(): number | null {
  return resolveMetrikaConfig(window.location.hostname, process.env.NEXT_PUBLIC_METRIKA_ID)?.id ?? null;
}

export function reachGoal(target: string) {
  const id = getMetrikaId();
  if (!id || typeof window.ym !== 'function') return;
  try {
    window.ym(id, 'reachGoal', target);
  } catch {
    // Analytics is best effort and must never block the user action.
  }
}

interface EcommerceProduct {
  id: string;
  name: string;
  price: number;
  category?: string;
  variant?: string;
  quantity?: number;
}

type EcommerceEvent = { detail: { products: EcommerceProduct[] } } | { add: { products: EcommerceProduct[] } } | { remove: { products: EcommerceProduct[] } };

export function pushEcommerceEvent(event: EcommerceEvent) {
  if (!getMetrikaId() || !Array.isArray(window.dataLayer)) return;
  try {
    window.dataLayer.push({ ecommerce: event });
  } catch {
    // Analytics is best effort and must never block the user action.
  }
}

const submittedOrderIds = new Set<string>();
const SUBMITTED_ORDERS_KEY = 'metrika-order-request-ids-v1';

function markOrderRequestOnce(orderId: string): boolean {
  if (submittedOrderIds.has(orderId)) return false;
  submittedOrderIds.add(orderId);
  try {
    const previous: unknown = JSON.parse(window.localStorage.getItem(SUBMITTED_ORDERS_KEY) ?? '[]');
    const ids = Array.isArray(previous) ? previous.filter((id): id is string => typeof id === 'string') : [];
    if (ids.includes(orderId)) return false;
    window.localStorage.setItem(SUBMITTED_ORDERS_KEY, JSON.stringify([...ids.slice(-99), orderId]));
  } catch {
    // The document-level set still deduplicates while storage is unavailable.
  }
  return true;
}

/**
 * A submitted request is an unpaid lead, not an ecommerce purchase. The backend order ID is the
 * stable reconciliation field. Deduplication lasts for this browser's site-data lifecycle (the
 * latest 100 IDs); if storage is unavailable it lasts for the current document lifecycle.
 */
export function trackOrderRequestSubmitted(receipt: { orderId: string; totalWithTax: number; currencyCode: string }): void {
  const id = getMetrikaId();
  if (!id || typeof window.ym !== 'function' || !markOrderRequestOnce(receipt.orderId)) return;
  try {
    window.ym(id, 'reachGoal', 'order_request_submitted', {
      orderId: receipt.orderId,
      value: receipt.totalWithTax / 100,
      currency: receipt.currencyCode,
    });
  } catch {
    // Analytics is best effort and must never change a valid checkout result.
  }
}
