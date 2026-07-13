declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    ym?: (...args: unknown[]) => void;
  }
}

const TAG_ID = 110706774;

export function reachGoal(target: string) {
  window.ym?.(TAG_ID, 'reachGoal', target);
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
  window.dataLayer?.push({ ecommerce: event });
}
