import { gql } from 'graphql-request';

// --- Types ---

export interface Country {
  code: string;
  name: string;
  languageCode: string;
}

export interface Address {
  fullName: string;
  company: string;
  streetLine1: string;
  streetLine2: string;
  city: string;
  province: string;
  postalCode: string;
  phoneNumber: string;
  id: string;
  country: Country;
  defaultShippingAddress: boolean;
  defaultBillingAddress: boolean;
}

export interface CurrentUser {
  id: string;
  identifier: string;
}

export interface Customer {
  id: string;
  lastName: string;
  firstName: string;
  emailAddress: string;
  phoneNumber: string;
  addresses: Address[];
  user: CurrentUser | null;
}

// --- Queries ---

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
