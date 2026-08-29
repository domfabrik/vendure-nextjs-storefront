import { gql } from 'graphql-request';

export const GET_PRODUCT_BY_SLUG = gql`
  query GetProductBySlug($slug: String!) {
    product(slug: $slug) {
      name
      description
      id
      slug
      optionGroups {
        name
        id
        code
        options {
          name
          id
          code
        }
      }
      assets {
        source
        preview
      }
      variants {
        id
        name
        currencyCode
        basePriceWithTax
        priceWithTax
        stockLevel
        sku
        featuredAsset {
          source
          preview
        }
        assets {
          source
          preview
        }
        options {
          id
          groupId
          code
          name
        }
        customFields {
          discountPercent
          oldPrice
          finishLabel
          finishDescription
          upholsteryLabel
          upholsteryDescription
          profileLabel
          profileDescription
        }
      }
      collections {
        slug
        name
        parent {
          slug
          name
          parent {
            slug
            name
          }
        }
      }
      featuredAsset {
        source
        preview
      }
      customFields {
        vendorName
        packageCount
        warrantyMonths
        weightKg
        volumeM3
        dimensionsMm
        includedItems
        decor
        additionalInfo
        packagingNotes
        maxLoadKg
        minimumDoorWidthCm
        frameMaterialText
        facadeMaterialText
        edgeMaterialText
        shelfMaterialText
        hardwareText
        frontHardwareText
        drawerMaterialText
        countertopMaterialText
        upholsteryText
        kitchenShape
        kitchenElements
        countertopDimensionsMm
        bedDimensionsMm
        recommendedMattressHeightMm
        mattressInsetMm
        mattressBase
      }
      facetValues {
        name
        id
        translations {
          name
          languageCode
          id
        }
      }
    }
  }
`;

export const GET_FEATURED_PRODUCTS = gql`
  query GetFeaturedProducts($take: Int) {
    search(input: { take: $take, groupByProduct: true, sort: { price: ASC } }) {
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
    }
  }
`;

export const GET_PRODUCT_SLIDERS = gql`
  query GetProductSliders($slug: String!) {
    collection(slug: $slug) {
      name
      slug
      parent {
        slug
      }
      productVariants(options: { take: 8, sort: { priceWithTax: DESC } }) {
        totalItems
        items {
          id
          name
          currencyCode
          priceWithTax
          featuredAsset {
            preview
          }
          product {
            collections {
              slug
              name
              parent {
                slug
              }
            }
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
