import { gql } from 'graphql-request';

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
