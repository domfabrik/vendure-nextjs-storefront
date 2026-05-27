export interface Discount {
  type: string;
  description: string;
  amountWithTax: number;
  adjustmentSource: string;
}

export interface Payment {
  id: string;
  method: string;
  amount: number;
  state: string;
  errorMessage: string | null;
}

export interface ShippingLine {
  shippingMethod: {
    id: string;
    name: string;
    description: string;
  };
  priceWithTax: number;
}

export interface ActiveOrderLine {
  id: string;
  quantity: number;
  linePriceWithTax: number;
  unitPriceWithTax: number;
  discountedLinePriceWithTax: number;
  featuredAsset: { id: string; preview: string } | null;
  productVariant: {
    name: string;
    id: string;
    sku: string;
    price: number;
    featuredAsset: { id: string; source: string } | null;
    stockLevel: string;
    product: { name: string; slug: string };
  };
}

export interface ActiveOrder {
  id: string;
  createdAt: string;
  updatedAt: string;
  totalQuantity: number;
  couponCodes: string[];
  code: string;
  customer: {
    id: string;
    emailAddress: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  } | null;
  shippingWithTax: number;
  totalWithTax: number;
  subTotalWithTax: number;
  discounts: Discount[];
  state: string;
  active: boolean;
  payments: Payment[];
  currencyCode: string;
  shippingLines: ShippingLine[];
  lines: ActiveOrderLine[];
}

export interface OrderLine {
  id: string;
  quantity: number;
  linePriceWithTax: number;
  unitPriceWithTax: number;
  discountedLinePriceWithTax: number;
  featuredAsset: { id: string; preview: string } | null;
  productVariant: {
    name: string;
    currencyCode: string;
    featuredAsset: { id: string; source: string } | null;
    product: { slug: string; name: string };
  };
}

export interface Order {
  type: string;
  shippingWithTax: number;
  totalWithTax: number;
  subTotalWithTax: number;
  discounts: Discount[];
  state: string;
  active: boolean;
  payments: Payment[];
  currencyCode: string;
  shippingLines: ShippingLine[];
  lines: OrderLine[];
}
