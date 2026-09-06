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

export const PREPARE_LEAD_ORDER = gql`
  mutation PrepareLeadOrder {
    prepareLeadOrder {
      sessionCapability
    }
  }
`;

export const SUBMIT_LEAD_ORDER = gql`
  mutation SubmitLeadOrder($input: SubmitLeadOrderInput!) {
    submitLeadOrder(input: $input) {
      orderId
      code
      currencyCode
      totalWithTax
      lines {
        productVariantId
        quantity
        unitPriceWithTax
        linePriceWithTax
      }
    }
  }
`;
