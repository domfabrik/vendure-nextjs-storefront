declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
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

type EcommerceEvent =
  | { detail: { products: EcommerceProduct[] } }
  | { add: { products: EcommerceProduct[] } }
  | { remove: { products: EcommerceProduct[] } }
  | { purchase: { actionField: { id: string }; products: EcommerceProduct[] } };

export function pushEcommerceEvent(event: EcommerceEvent) {
  window.dataLayer?.push({ ecommerce: event });
}
