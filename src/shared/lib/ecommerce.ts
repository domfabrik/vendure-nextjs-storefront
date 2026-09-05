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
  if (id && typeof window.ym === 'function') window.ym(id, 'reachGoal', target);
}

interface EcommerceProduct {
  id: string;
  name: string;
  price: number;
  category?: string;
  variant?: string;
  quantity?: number;
}

type EcommerceEvent =
  | { detail: { products: EcommerceProduct[] } }
  | { add: { products: EcommerceProduct[] } }
  | { remove: { products: EcommerceProduct[] } }
  | { purchase: { actionField: { id: string }; products: EcommerceProduct[] } };

export function pushEcommerceEvent(event: EcommerceEvent) {
  if (getMetrikaId() && Array.isArray(window.dataLayer)) window.dataLayer.push({ ecommerce: event });
}
