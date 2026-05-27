export interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  code: string;
  isEligible: boolean;
}
