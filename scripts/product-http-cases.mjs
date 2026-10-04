import assert from 'node:assert/strict';

// Isolated PDP fixture: injects failures only for synthetic product/collection slugs.
export function productHttpFixture(product, collection) {
  const productRequests = new Map();
  const recommendationRequests = new Map();
  let freshnessState = { priceWithTax: 1000, stockLevel: 'IN_STOCK' };
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const recommendations = new Set(['pdp-related-http', 'pdp-related-graphql', 'pdp-related-slow-error', 'pdp-related-slow-ok']);
  return {
    async handle(query, variables, response) {
      if (query.includes('GetProductBySlug')) {
        const slug = variables.slug;
        productRequests.set(slug, (productRequests.get(slug) ?? 0) + 1);
        if (slug === 'pdp-primary-graphql' || slug === 'pdp-primary-late-error') {
          if (slug === 'pdp-primary-late-error') await delay(350);
          response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ data: { product: null }, errors: [{ message: 'synthetic primary failure' }] }));
          return true;
        }
        if (slug === 'pdp-primary-disconnect') {
          await delay(350);
          response.destroy();
          return true;
        }
        if (slug === 'pdp-no-related') {
          const item = product(slug);
          item.collections = [collection('all'), collection('search')];
          response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ data: { product: item } }));
          return true;
        }
        if (slug === 'pdp-freshness') {
          const item = product(slug);
          item.variants[0] = {
            ...item.variants[0],
            priceWithTax: freshnessState.priceWithTax,
            stockLevel: freshnessState.stockLevel,
          };
          response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ data: { product: item } }));
          return true;
        }
        if (recommendations.has(slug)) {
          const item = product(slug);
          item.collections = [collection(slug)];
          response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ data: { product: item } }));
          return true;
        }
      }
      if (query.includes('SearchCollectionProducts')) {
        const slug = variables.collectionSlug;
        recommendationRequests.set(slug, (recommendationRequests.get(slug) ?? 0) + 1);
        if (!recommendations.has(slug)) return false;
        if (slug.includes('slow')) await delay(350);
        if (slug === 'pdp-related-slow-ok') {
          response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ data: { search: { totalItems: 0, items: [] } } }));
        } else if (slug === 'pdp-related-graphql') {
          response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ errors: [{ message: 'synthetic recommendations failure' }] }));
        } else {
          response.writeHead(503).end('synthetic recommendations unavailable');
        }
        return true;
      }
      return false;
    },
    async verify(baseUrl, logs) {
      const productJson = (html) => {
        const entries = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
        return entries.find((entry) => entry['@type'] === 'Product');
      };
      const recommendationRequestTotal = () => [...recommendationRequests.values()].reduce((total, count) => total + count, 0);
      const assertCompletePrimaryProduct = (response, html, slug, label) => {
        assert.equal(response.status, 200, `${label} keeps the complete primary product`);
        assert.match(html, /<h1\b[^>]*>Тестовый стул<\/h1>/);
        assert.match(html, /В наличии/);
        const canonicals = [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/g)];
        assert.deepEqual(
          canonicals.map((match) => match[1]),
          [`${baseUrl}/products/${slug}`],
        );
        assert.match(html, />10(?:\s|&nbsp;|<)/);
        assert.equal(productJson(html)?.offers.lowPrice, 10);
        assert.equal(productJson(html)?.offers.availability, 'https://schema.org/InStock');
      };
      for (const userAgent of ['Mozilla/5.0', 'YandexBot/3.0']) {
        const get = (path) => fetch(`${baseUrl}${path}`, { headers: { 'user-agent': userAgent } });
        freshnessState = { priceWithTax: 1000, stockLevel: 'IN_STOCK' };
        const freshnessBefore = productRequests.get('pdp-freshness') ?? 0;
        const freshFirstResponse = await get('/products/pdp-freshness');
        const freshFirstHtml = await freshFirstResponse.text();
        const freshnessAfterFirst = productRequests.get('pdp-freshness') ?? 0;
        assert.equal(freshnessAfterFirst - freshnessBefore, 1, `TC-2 ${userAgent} first freshness GET is one raw request`);
        assert.equal(freshFirstResponse.status, 200);
        assert.match(freshFirstHtml, />10(?:\s|&nbsp;|<)/);
        assert.match(freshFirstHtml, /В наличии/);
        assert.equal(productJson(freshFirstHtml)?.offers.availability, 'https://schema.org/InStock');
        freshnessState = { priceWithTax: 2000, stockLevel: 'OUT_OF_STOCK' };
        const freshSecondResponse = await get('/products/pdp-freshness');
        const freshSecondHtml = await freshSecondResponse.text();
        const freshnessAfterSecond = productRequests.get('pdp-freshness') ?? 0;
        assert.equal(freshnessAfterSecond - freshnessAfterFirst, 1, `TC-2 ${userAgent} second freshness GET is fresh`);
        assert.equal(freshSecondResponse.status, 200);
        assert.match(freshSecondHtml, />20(?:\s|&nbsp;|<)/);
        assert.match(freshSecondHtml, /Нет в наличии/);
        assert.equal(productJson(freshSecondHtml)?.offers.availability, 'https://schema.org/OutOfStock');
        const relatedBefore = recommendationRequests.get('chairs') ?? 0;
        const normalBefore = productRequests.get('test-chair') ?? 0;
        const normalResponse = await get('/products/test-chair');
        const normalHtml = await normalResponse.text();
        assert.equal(normalResponse.status, 200, `TC-F1 ${userAgent} normal product status`);
        assert.equal((productRequests.get('test-chair') ?? 0) - normalBefore, 1, `TC-PDP ${userAgent} test-chair GetProductBySlug requests`);
        assert.match(normalHtml, /Также вам может быть интересно/);
        assert.match(normalHtml, /href="\/products\/test-chair-1(?:\?[^\"]*)?"/);
        assert.match(normalHtml, /Тестовый стул 1/);
        assert.equal((recommendationRequests.get('chairs') ?? 0) - relatedBefore, 1, `TC-F1 ${userAgent} normal product loads one recommendation request`);
        const noRelatedBefore = recommendationRequestTotal();
        const noRelatedResponse = await get('/products/pdp-no-related');
        const noRelatedHtml = await noRelatedResponse.text();
        assertCompletePrimaryProduct(noRelatedResponse, noRelatedHtml, 'pdp-no-related', `TC-F1 ${userAgent} no-related product`);
        assert.doesNotMatch(noRelatedHtml, /Также вам может быть интересно/);
        assert.equal(recommendationRequestTotal(), noRelatedBefore, `TC-F1 ${userAgent} no-related product must not call any recommendations query`);
        for (const slug of ['test-chair', ...recommendations]) {
          const before = productRequests.get(slug) ?? 0;
          const response = await get(`/products/${slug}`);
          const html = await response.text();
          assertCompletePrimaryProduct(response, html, slug, `TC-PDP ${userAgent} ${slug}`);
          if (slug !== 'test-chair') assert.doesNotMatch(html, /Также вам может быть интересно/);
          const requestDelta = (productRequests.get(slug) ?? 0) - before;
          assert.equal(requestDelta, 1, `TC-PDP ${userAgent} ${slug} GetProductBySlug requests`);
          console.log(`TC-PDP ${userAgent} ${slug} GetProductBySlug requests=${requestDelta}`);
        }
        for (const suffix of ['', '?variant=cheapest-offer', '?variant=does-not-exist']) {
          const response = await get(`/products/chosen-offer-product${suffix}`);
          const html = (await response.text()).replace(/<!--.*?-->/g, '');
          assert.equal(response.status, 200, `TC-PDP variant ${suffix}`);
          assert.match(html, suffix === '?variant=cheapest-offer' ? /-20%/ : /-40%/);
          assert.match(html, /rel="canonical"[^>]*href="[^"]*\/products\/chosen-offer-product"/);
          assert.ok(productJson(html));
        }
        for (const slug of ['missing', 'api-error', 'pdp-primary-graphql', 'pdp-primary-late-error', 'pdp-primary-disconnect']) {
          const response = await get(`/products/${slug}`);
          const html = await response.text();
          assert.equal(response.status, slug === 'missing' ? 404 : 500, `TC-PDP ${userAgent} honest raw HTTP status for ${slug}`);
          assert.doesNotMatch(html, /rel="canonical"/);
          assert.equal(productJson(html), undefined);
          assert.doesNotMatch(html, /<h1\b[^>]*>Тестовый стул<\/h1>/);
          assert.match(html, /name="robots"[^>]*content="[^"]*noindex/);
        }
      }
      assert.match(logs(), /\[catalog-ssr\].*SearchCollectionProducts/);
      assert.doesNotMatch(logs(), /synthetic recommendations failure|synthetic recommendations unavailable/);
      const records = [...logs().matchAll(/\[catalog-ssr\] (\{[^\n]+\})/g)].map((match) => JSON.parse(match[1])).filter((entry) => entry.category?.startsWith('pdp-related-'));
      assert.equal(records.length, 6, 'one safe diagnostic per failing recommendation request');
      for (const record of records) {
        assert.deepEqual(Object.keys(record).sort(), ['category', 'errorClass', 'operation']);
        assert.equal(record.operation, 'SearchCollectionProducts');
      }
      console.log('TC-PDP complete product, variants, recommendations failures/delay, primary errors/disconnect, 404 and UA parity passed');
    },
  };
}
