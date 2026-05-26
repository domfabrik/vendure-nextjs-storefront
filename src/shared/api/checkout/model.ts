import { gql } from 'graphql-request';

// --- Types ---

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

// --- Queries ---

export const GET_ELIGIBLE_SHIPPING_METHODS = gql`
    query GetEligibleShippingMethods {
        eligibleShippingMethods {
            id
            name
            price
            description
        }
    }
`;

export const GET_ELIGIBLE_PAYMENT_METHODS = gql`
    query GetEligiblePaymentMethods {
        eligiblePaymentMethods {
            id
            name
            description
            code
            isEligible
        }
    }
`;
