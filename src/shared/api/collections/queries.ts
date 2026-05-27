import { gql } from 'graphql-request';

export const GET_COLLECTION_BY_SLUG = gql`
  query GetCollectionBySlug($slug: String!) {
    collection(slug: $slug) {
      name
      slug
      description
      featuredAsset {
        preview
      }
      parent {
        slug
        name
      }
      children {
        id
        name
        slug
        featuredAsset {
          preview
        }
      }
    }
  }
`;

export const GET_ALL_COLLECTIONS = gql`
  query GetAllCollections {
    collections(options: { filter: { slug: { notEq: "search" } } }) {
      items {
        name
        id
        slug
        parent {
          id
          slug
        }
        description
        featuredAsset {
          preview
        }
      }
    }
  }
`;

export const SEARCH_COLLECTION_PRODUCTS = gql`
  query SearchCollectionProducts($collectionSlug: String!, $take: Int) {
    search(input: { collectionSlug: $collectionSlug, take: $take, groupByProduct: true }) {
      totalItems
      items {
        productName
        slug
        productVariantId
        currencyCode
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
        productAsset {
          preview
        }
      }
    }
  }
`;

export const GET_COLLECTION_PRODUCT_VARIANTS = gql`
  query GetCollectionProductVariants($slug: String!) {
    collection(slug: $slug) {
      id
      productVariants(options: { take: 4, sort: { createdAt: ASC } }) {
        totalItems
        items {
          id
          featuredAsset {
            preview
          }
          priceWithTax
          currencyCode
          name
          product {
            name
            slug
            featuredAsset {
              preview
            }
          }
        }
      }
    }
  }
`;
