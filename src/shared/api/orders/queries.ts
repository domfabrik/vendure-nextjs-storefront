import { gql } from 'graphql-request';

export const GET_ACTIVE_ORDER = gql`
  query GetActiveOrder {
    activeOrder {
      id
      createdAt
      updatedAt
      totalQuantity
      couponCodes
      code
      customer {
        id
        emailAddress
        firstName
        lastName
        phoneNumber
      }
      shippingWithTax
      totalWithTax
      subTotalWithTax
      discounts {
        type
        description
        amountWithTax
        adjustmentSource
      }
      state
      active
      payments {
        id
        method
        amount
        state
        errorMessage
      }
      currencyCode
      shippingLines {
        shippingMethod {
          id
          name
          description
        }
        priceWithTax
      }
      lines {
        id
        quantity
        linePriceWithTax
        unitPriceWithTax
        discountedLinePriceWithTax
        featuredAsset {
          id
          preview
        }
        productVariant {
          name
          id
          sku
          price
          featuredAsset {
            id
            source
          }
          stockLevel
          product {
            name
            slug
          }
        }
      }
    }
  }
`;

export const GET_ORDER_BY_CODE = gql`
  query GetOrderByCode($code: String!) {
    orderByCode(code: $code) {
      type
      shippingWithTax
      totalWithTax
      subTotalWithTax
      discounts {
        type
        description
        amountWithTax
        adjustmentSource
      }
      state
      active
      payments {
        id
        method
        amount
        state
        errorMessage
      }
      currencyCode
      shippingLines {
        shippingMethod {
          id
          name
          description
        }
        priceWithTax
      }
      lines {
        id
        quantity
        linePriceWithTax
        unitPriceWithTax
        discountedLinePriceWithTax
        featuredAsset {
          id
          preview
        }
        productVariant {
          name
          currencyCode
          featuredAsset {
            id
            source
          }
          product {
            slug
            name
          }
        }
      }
    }
  }
`;
