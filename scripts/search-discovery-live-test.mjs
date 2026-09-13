import assert from 'node:assert/strict';

const endpointFlag = process.argv.indexOf('--endpoint');
const endpoint = endpointFlag >= 0 ? process.argv[endpointFlag + 1] : undefined;
if (!endpoint || !/^https:\/\/[^/]+\/shop-api$/.test(endpoint)) {
  throw new Error('Usage: node scripts/search-discovery-live-test.mjs --endpoint https://HOST/shop-api');
}

const targetSlug = 'kopiya-shkaf-natali-2-stv-s-zerkalom-belyj-glyanec';
const query = `
  query SearchDiscovery($input: SearchInput!) {
    search(input: $input) {
      totalItems
      items {
        productName
        productVariantId
        productVariantName
        slug
        facetValueIds
      }
    }
  }
`;

async function search(input) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'vendure-token': 'default-channel' },
    body: JSON.stringify({ query, variables: { input } }),
  });
  assert.equal(response.status, 200, `Shop API returned ${response.status}`);
  const payload = await response.json();
  assert.deepEqual(payload.errors, undefined, `GraphQL errors: ${JSON.stringify(payload.errors)}`);
  return payload.data.search;
}

async function textSearch(term, extra = {}) {
  return search({ term, take: 200, skip: 0, groupByProduct: true, ...extra });
}

function rankOf(result, slug) {
  const index = result.items.findIndex((item) => item.slug === slug);
  return index < 0 ? null : index + 1;
}

const targetCases = [
  ['Натали', 74],
  ['шкаф Натали', 58],
  ['шкаф Натали с зеркалом', 2],
  ['белый глянец', 126],
  ['Шкаф Натали 2-дверный с зеркалом белый глянец', 1],
  ['ШКАФ НАТАЛИ', 58],
  ['  шкаф   Натали  ', 58],
  ['шкаф, Натали!', 58],
];
const targetEvidence = await Promise.all(
  targetCases.map(async ([term, expectedTotal]) => {
    const result = await textSearch(term);
    const rank = rankOf(result, targetSlug);
    assert.equal(result.totalItems, expectedTotal, `${JSON.stringify(term)} total changed`);
    assert.ok(rank, `${JSON.stringify(term)} must include the target product`);
    return { term, total: result.totalItems, targetRank: rank };
  }),
);

const shortRelevant = await textSearch('шкаф Натали', { take: 6 });
const shortPriceDesc = await textSearch('шкаф Натали', { sort: { price: 'DESC' } });
assert.equal(rankOf(shortRelevant, targetSlug), 1, 'relevance should put the target first');
assert.equal(rankOf(shortPriceDesc, targetSlug), 21, 'the diagnosed price sort should move the target to rank 21');
assert.equal(
  shortPriceDesc.items.slice(0, 6).some((item) => item.slug === targetSlug),
  false,
  'the old autocomplete window should omit the target',
);

const abbreviation = await textSearch('шкаф Натали 2-ств');
assert.equal(abbreviation.totalItems, 3, 'the documented 2-ств limitation changed');
assert.equal(rankOf(abbreviation, targetSlug), null, '2-ств is not currently a synonym for 2-дверный');

const empty = await textSearch('zzzz-no-such-product-zzzz');
assert.equal(empty.totalItems, 0, 'unknown term should have no results');
assert.deepEqual(empty.items, [], 'unknown term should have no items');

const pageSize = 24;
const pages = await Promise.all([0, pageSize, pageSize * 2].map((skip) => search({ term: 'белый глянец', take: pageSize, skip, groupByProduct: true })));
assert.deepEqual(
  pages.map((page) => page.totalItems),
  [126, 126, 126],
  'pagination must keep the same total',
);
const pagedSlugs = pages.flatMap((page) => page.items.map((item) => item.slug));
assert.equal(new Set(pagedSlugs).size, pagedSlugs.length, 'the first three pages must not overlap');
assert.ok(
  pages[2].items.some((item) => item.slug === targetSlug),
  'the broad finish query should contain the target on page 3',
);

const categoryCases = [
  ['шкаф Натали', targetSlug],
  ['диван Гравита', 'divan-gravita-2h-mestnyj-seryj-serebro'],
  ['матрас', 'matras-lider-optima'],
  ['кровать Натали', 'krovat-natali-1-6m-belyj-glyanec'],
  ['комод Натали', 'komod-natali-belyj-glyanec'],
  ['тумба Натали', 'tumba-natali-belyj-glyanec'],
  ['зеркало Натали', 'zerkalo-natali-belyj-glyanec'],
  ['банкетка Натали', 'banketka-natali-belyj-glyanec'],
  ['витрина Натали', 'vitrina-natali-1-stv-belyj-glyanec'],
  ['стол', 'stol-dzhokonda-koren-duba-glyanec'],
  ['кресло', 'kreslo-zamira-bezhevyj'],
  ['кухня', 'kuhnya-verona-pryamaya-3-3m-krem-glyanec'],
];
await Promise.all(
  categoryCases.map(async ([term, expectedSlug]) => {
    const result = await textSearch(term, { take: 24 });
    assert.ok(
      result.items.some((item) => item.slug === expectedSlug),
      `${JSON.stringify(term)} should include ${expectedSlug} on page 1`,
    );
  }),
);

const brandCases = [
  ['55', 481],
  ['162', 786],
  ['219', 137],
  ['256', 103],
  ['257', 21],
];
const brandEvidence = await Promise.all(
  brandCases.map(async ([facetValueId, expectedTotal]) => {
    const result = await search({ take: 6, skip: 0, groupByProduct: true, facetValueFilters: [{ and: facetValueId }] });
    assert.equal(result.totalItems, expectedTotal, `brand facet ${facetValueId} total changed`);
    assert.ok(
      result.items.every((item) => item.facetValueIds.includes(facetValueId)),
      `brand facet ${facetValueId} leaked another brand`,
    );
    return { facetValueId, total: result.totalItems };
  }),
);

const groupedMattresses = await textSearch('матрас');
const mattressVariants = await search({ term: 'матрас', take: 100, skip: 0, groupByProduct: false });
assert.equal(groupedMattresses.totalItems, 34, 'grouped mattress product total changed');
assert.equal(mattressVariants.totalItems, 590, 'ungrouped mattress variant total changed');
assert.equal(new Set(groupedMattresses.items.map((item) => item.slug)).size, groupedMattresses.items.length, 'grouped results must use one row per product');
assert.ok(mattressVariants.items.filter((item) => item.slug === 'matras-lider-optima').length > 1, 'ungrouped results should expose mattress variants');

await Promise.all(
  ['BED_EVA_140-200', '140143'].map(async (hiddenSku) => {
    const result = await search({ term: hiddenSku, take: 100, skip: 0, groupByProduct: false });
    assert.equal(result.totalItems, 0, `disabled SKU ${hiddenSku} must not appear in Shop API search`);
  }),
);

console.log(
  JSON.stringify({
    endpoint,
    targetEvidence,
    diagnosedRanks: { relevance: 1, priceDesc: 21 },
    abbreviation: { total: abbreviation.totalItems, targetRank: null },
    pagination: { term: 'белый глянец', total: pages[0].totalItems, targetPage: 3 },
    categoryCases: categoryCases.length,
    brandEvidence,
    grouping: { groupedProducts: groupedMattresses.totalItems, rawVariants: mattressVariants.totalItems },
    hiddenSkusChecked: 2,
  }),
);
