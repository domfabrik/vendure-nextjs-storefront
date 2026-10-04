import assert from 'node:assert/strict';
import { buildSchema, graphql } from 'graphql';
import { SEARCH_FACETS, SEARCH_PRODUCTS } from '../src/shared/api/search/queries.ts';

const schema = buildSchema(`
  input SearchInput { take: Int, skip: Int, groupByProduct: Boolean }
  type Search { items: [SearchItem!]!, totalItems: Int!, facetValues: [SearchFacetValue!]! }
  type SearchItem {
    productName: String, slug: String, collectionIds: [String], currencyCode: String,
    productVariantId: String, productVariantName: String, discountPercent: Float,
    basePriceWithTax: Price, priceWithTax: Price, facetIds: [String], facetValueIds: [String],
    productAsset: Asset, description: String, chosenOffer: ChosenOffer
  }
  type Asset { preview: String }
  union Price = PriceRange | SinglePrice
  type PriceRange { max: Float, min: Float }
  type SinglePrice { value: Float }
  type ChosenOffer {
    productVariantId: String, currencyCode: String, priceWithTax: Float,
    basePriceWithTax: Float, discountPercent: Float, productAsset: Asset
  }
  type SearchFacetValue { count: Int!, facetValue: FacetValue! }
  type FacetValue { id: String!, name: String!, code: String!, facet: Facet! }
  type Facet { id: String!, name: String!, code: String! }
  type Query { search(input: SearchInput!): Search! }
`);

const expectedFacets = [
  {
    count: 2,
    facetValue: {
      id: 'facet-value-wood',
      name: 'Дерево',
      code: 'wood',
      facet: { id: 'facet-material', name: 'Материал', code: 'material' },
    },
  },
];

function createFixture() {
  const counters = { searchItemLookup: 0, itemsField: 0, chosenOffer: 0, pricing: 0, stock: 0, resolvedTake: [] };
  const item = {
    productName: 'Fixture chair',
    slug: 'fixture-chair',
    collectionIds: ['chairs'],
    currencyCode: 'RUB',
    productVariantId: 'variant-1',
    productVariantName: 'Chair',
    discountPercent: 0,
    facetIds: ['facet-material'],
    facetValueIds: ['facet-value-wood'],
    productAsset: { preview: 'fixture.jpg' },
    description: 'fixture',
    chosenOffer: {
      productVariantId: 'variant-1',
      currencyCode: 'RUB',
      priceWithTax: 100,
      basePriceWithTax: 100,
      discountPercent: 0,
      productAsset: { preview: 'fixture.jpg' },
    },
    basePriceWithTax: { __typename: 'SinglePrice', value: 100 },
    priceWithTax: { __typename: 'SinglePrice', value: 100 },
  };
  const root = {
    search: ({ input }) => {
      const take = input.take || 25;
      counters.resolvedTake.push(take);
      // Vendure's search service eagerly prepares the bounded result set before
      // GraphQL field selection. This residual work is tracked separately from
      // item/pricing/stock field resolution, which the facet document avoids.
      counters.searchItemLookup += 1;
      const result = {
        totalItems: 2,
        facetValues: expectedFacets,
        items: () => {
          counters.itemsField += take;
          return Array.from({ length: take }, () => item);
        },
      };
      return result;
    },
  };
  schema.getType('SearchItem').getFields().basePriceWithTax.resolve = () => {
    counters.pricing += 1;
    return item.basePriceWithTax;
  };
  schema.getType('SearchItem').getFields().chosenOffer.resolve = () => {
    counters.chosenOffer += 1;
    counters.stock += 1;
    return item.chosenOffer;
  };
  schema.getType('SearchItem').getFields().priceWithTax.resolve = () => {
    counters.pricing += 1;
    return item.priceWithTax;
  };
  schema.getType('ChosenOffer').getFields().priceWithTax.resolve = () => {
    counters.pricing += 1;
    return item.chosenOffer.priceWithTax;
  };
  schema.getType('ChosenOffer').getFields().basePriceWithTax.resolve = () => {
    counters.pricing += 1;
    return item.chosenOffer.basePriceWithTax;
  };
  return { counters, root };
}

const facetFixture = createFixture();
const facetResult = await graphql({
  schema,
  source: SEARCH_FACETS,
  rootValue: facetFixture.root,
  variableValues: { input: { take: 0, skip: 0, groupByProduct: true } },
});
assert.deepEqual(facetResult.errors, undefined, 'facet-only document must execute without GraphQL errors');
assert.deepEqual(JSON.parse(JSON.stringify(facetResult.data?.search)), { totalItems: 2, facetValues: expectedFacets }, 'facet-only result keeps total and facet counts');
assert.deepEqual(
  facetFixture.counters,
  { searchItemLookup: 1, itemsField: 0, chosenOffer: 0, pricing: 0, stock: 0, resolvedTake: [25] },
  'take 0 -> 25 leaves only the eager search lookup and avoids item/pricing/stock fields',
);

const productFixture = createFixture();
const productResult = await graphql({
  schema,
  source: SEARCH_PRODUCTS,
  rootValue: productFixture.root,
  variableValues: { input: { take: 0, skip: 0, groupByProduct: true } },
});
assert.deepEqual(productResult.errors, undefined, 'product document must execute without GraphQL errors');
assert.equal(productResult.data?.search.totalItems, 2, 'product result preserves total');
assert.deepEqual(JSON.parse(JSON.stringify(productResult.data?.search.facetValues)), expectedFacets, 'product result preserves facet counts');
assert.equal(productFixture.counters.resolvedTake[0], 25, 'product query fixture retains backend take 0 -> 25 behavior');
assert.equal(productFixture.counters.searchItemLookup, 1, 'product document performs the eager search lookup');
assert.equal(productFixture.counters.itemsField, 25, 'product document resolves returned items');
assert.ok(productFixture.counters.chosenOffer > 0, 'product document resolves chosen offer variant work');
assert.ok(productFixture.counters.pricing > 0, 'product document resolves pricing fields');
assert.ok(productFixture.counters.stock > 0, 'product document resolves stock work');

console.log('Facet-only GraphQL resolver contract passed');
