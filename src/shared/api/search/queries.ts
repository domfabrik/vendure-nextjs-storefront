import { gql } from 'graphql-request';

export const SEARCH_PRODUCTS = gql`
  query SearchProducts($input: SearchInput!) {
    search(input: $input) {
      items {
        productName
        slug
        collectionIds
        currencyCode
        productVariantId
        productVariantName
        discountPercent
        basePriceWithTax {
          __typename
          ... on PriceRange {
            max
            min
          }
          ... on SinglePrice {
            value
          }
        }
        priceWithTax {
          __typename
          ... on PriceRange {
            max
            min
          }
          ... on SinglePrice {
            value
          }
        }
        facetIds
        facetValueIds
        productAsset {
          preview
        }
        description
      }
      totalItems
      facetValues {
        count
        facetValue {
          id
          name
          code
          facet {
            id
            name
            code
          }
        }
      }
    }
  }
`;
