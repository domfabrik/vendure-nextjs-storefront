import { gql } from 'graphql-request';

export const PREPARE_DESCRIPTION_COMPARISON = gql`
  mutation PrepareDescriptionComparison($experimentKey: String!) {
    prepareDescriptionComparison(experimentKey: $experimentKey) {
      status
      ballotToken
      productId
      slug
      productName
      imageUrl
      leftText
      rightText
      sourceUrl
      sourceKind
      parsedCharacteristics {
        name
        value
      }
      completed
      total
    }
  }
`;

export const SUBMIT_DESCRIPTION_COMPARISON = gql`
  mutation SubmitDescriptionComparison($input: DescriptionComparisonVoteInput!) {
    submitDescriptionComparison(input: $input) {
      saved
      duplicate
      completed
    }
  }
`;
