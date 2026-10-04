import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSerializer } from 'nuqs/server';
import { resolveSearchSort, searchParsers } from '../src/app/search/search-params.ts';
import { buildHeaderSearchInput, HEADER_SEARCH_TAKE } from '../src/shared/ui/header/components/search-input.ts';

const serializeSearch = createSerializer(searchParsers);
const implicitSearch = new URLSearchParams(serializeSearch({ q: 'диван' }));
const explicitNameAscSearch = new URLSearchParams(serializeSearch({ q: 'диван', sort: 'name-ASC' }));
assert.equal(implicitSearch.get('sort'), null, 'TC1 implicit search omits sort');
assert.equal(explicitNameAscSearch.get('sort'), 'name-ASC', 'TC2 explicit name-ASC survives URL serialization');
assert.equal(resolveSearchSort('диван', 'name-ASC', implicitSearch.has('sort')), undefined, 'TC1 serialized implicit search uses relevance');
assert.deepEqual(resolveSearchSort('диван', 'name-ASC', explicitNameAscSearch.has('sort')), { name: 'ASC' }, 'TC2 serialized explicit name-ASC keeps alphabetical ordering');

assert.equal(resolveSearchSort('диван', 'name-ASC', false), undefined, 'TC1 nonempty term without sort uses relevance');
assert.equal(resolveSearchSort('  диван  ', 'name-ASC', false), undefined, 'TC1 whitespace around term does not restore implicit sort');

for (const sortKey of ['name-ASC', 'name-DESC', 'price-ASC', 'price-DESC']) {
  assert.deepEqual(
    resolveSearchSort('диван', sortKey, true),
    {
      [sortKey.startsWith('price') ? 'price' : 'name']: sortKey.endsWith('ASC') ? 'ASC' : 'DESC',
    },
    `TC2 explicit ${sortKey} is preserved`,
  );
}

assert.deepEqual(resolveSearchSort('', 'name-ASC', false), { name: 'ASC' }, 'TC2 empty term keeps catalog default sort');
assert.deepEqual(resolveSearchSort('   ', 'name-ASC', false), { name: 'ASC' }, 'TC2 whitespace-only term keeps catalog default sort');
assert.deepEqual(resolveSearchSort('', 'relevance', true), { name: 'ASC' }, 'TC2 empty term keeps catalog default even with relevance key');
assert.equal(resolveSearchSort('диван', 'relevance', true), undefined, 'TC2 explicit relevance keeps API sort omitted');
assert.deepEqual(resolveSearchSort('диван', 'unknown', true), { name: 'ASC' }, 'TC2 invalid explicit sort keeps safe default');

const pageSource = readFileSync(new URL('../src/app/search/page.tsx', import.meta.url), 'utf8');
const collectionPageSource = readFileSync(new URL('../src/app/collections/[slug]/page.tsx', import.meta.url), 'utf8');
const searchClientPageSource = readFileSync(new URL('../src/app/search/search-page.tsx', import.meta.url), 'utf8');
const collectionClientPageSource = readFileSync(new URL('../src/app/collections/[slug]/collection-page.tsx', import.meta.url), 'utf8');
const searchApiSource = readFileSync(new URL('../src/shared/api/search/api.ts', import.meta.url), 'utf8');
const searchQueriesSource = readFileSync(new URL('../src/shared/api/search/queries.ts', import.meta.url), 'utf8');
assert.match(pageSource, /resolveSearchSort\(term, sortKey, searchParams\.sort !== undefined\)/, 'TC1 page uses the tested sort resolver');
assert.match(pageSource, /defaultSortIsRelevance=\{term\.length > 0 && searchParams\.sort === undefined\}/, 'TC2 page exposes implicit relevance to the control');
assert.match(pageSource, /take: PER_PAGE/, 'TC2 search page keeps the first-page size');
assert.match(pageSource, /skip: \(page - 1\) \* PER_PAGE/, 'TC2 search page keeps the requested page offset');
assert.match(pageSource, /hasFilters \? searchFacets\(baseQuery\) : null/, 'TC2 search facet counts use the bounded facet-only operation');
assert.match(collectionPageSource, /hasFilters \? searchFacets\(baseQuery\) : null/, 'TC2 collection facet counts use the bounded facet-only operation');
assert.match(pageSource, /allFacetValues=\{\(facetData \?\? initialData\)\.facetValues\}/, 'TC2 search SSR passes facet-only data with primary fallback');
assert.match(collectionPageSource, /allFacetValues=\{\(facetData \?\? initialData\)\.facetValues\}/, 'TC2 collection SSR passes facet-only data with primary fallback');
assert.match(searchClientPageSource, /reduceFacets\(allFacetValues, initialData\?\.facetValues \?\? \[\]\)/, 'TC2 search client derives counts from primary filtered data');
assert.match(collectionClientPageSource, /reduceFacets\(allFacetValues, initialData\.facetValues\)/, 'TC2 collection client derives counts from primary filtered data');
assert.match(searchApiSource, /export async function searchFacets\(params: SearchInput\)/, 'TC2 facet-only API is publicly exported');
assert.match(searchQueriesSource, /query SearchFacets\(\$input: SearchInput!\)/, 'TC2 facet-only operation has a separate GraphQL document');
const facetQuery = searchQueriesSource.slice(searchQueriesSource.indexOf('query SearchFacets'));
assert.doesNotMatch(facetQuery, /\bitems\b|discountPercent|basePriceWithTax|chosenOffer/, 'TC2 facet-only document excludes product items and pricing fields');

for (const term of ['шкаф Натали', 'ШКАФ НАТАЛИ', '  шкаф   Натали  ', 'шкаф, Натали!', 'шкаф Натали 2-ств']) {
  const input = buildHeaderSearchInput(term);
  assert.deepEqual(input, { term, take: HEADER_SEARCH_TAKE }, `TC2 autocomplete keeps ${JSON.stringify(term)} and uses relevance`);
  assert.equal(Object.hasOwn(input, 'sort'), false, 'TC1 autocomplete must not replace relevance with a price sort');
}

const headerSearchSource = readFileSync(new URL('../src/shared/ui/header/components/search.tsx', import.meta.url), 'utf8');
assert.match(headerSearchSource, /searchProducts\(buildHeaderSearchInput\(debouncedQuery\)\)/, 'TC1 header uses the tested autocomplete input builder');
assert.match(headerSearchSource, /setResults\(res\.items\)/, 'TC2 zero-result responses replace stale autocomplete options');
assert.match(headerSearchSource, /setTotalItems\(res\.totalItems\)/, 'TC2 autocomplete keeps the API total for all-results navigation');

console.log('Search relevance sort resolution checks passed');
