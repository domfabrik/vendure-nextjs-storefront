import { gql } from 'graphql-request';

export const GET_ACTIVE_CUSTOMER = gql`
    query GetActiveCustomer {
        activeCustomer {
            id
            lastName
            firstName
            emailAddress
            phoneNumber
            addresses {
                fullName
                company
                streetLine1
                streetLine2
                city
                province
                postalCode
                phoneNumber
                id
                country {
                    code
                    name
                    languageCode
                }
                defaultShippingAddress
                defaultBillingAddress
            }
            user {
                id
                identifier
            }
        }
    }
`;
