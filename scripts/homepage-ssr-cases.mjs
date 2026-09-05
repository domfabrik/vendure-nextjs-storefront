import assert from 'node:assert/strict';

const SECRET = 'SSR_SECRET_PAYLOAD_SENTINEL';
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function homepageFixture(tileProduct) {
  let mode;
  let stats;
  const reset = (scenario) => {
    mode = scenario;
    stats = { lists: 0, active: 0, peak: 0, starts: [], cancelled: [], completed: [], connections: new Set() };
  };
  const slugs = Array.from({ length: 41 }, (_, index) => `ssr-category-${index}`);
  async function handle(query, variables, response, request) {
    if (!mode) return false;
    const snapshot = stats;
    if (query.includes('GetAllCollections')) {
      snapshot.lists++;
      if (mode === 'critical') response.writeHead(502).end(SECRET);
      else {
        const items =
          mode === 'empty' ? [] : slugs.map((slug, index) => ({ id: String(index), slug, name: `Категория ${index}`, parent: null, description: '', featuredAsset: null }));
        response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ data: { collections: { items } } }));
      }
      return true;
    }
    if (!query.includes('SearchCollectionProducts')) return false;
    const index = slugs.indexOf(variables.collectionSlug);
    assert.notEqual(index, -1, 'unexpected collection');
    assert.equal(variables.take, 6, 'happy-path category assortment must retain take=6');
    snapshot.starts.push({ index, time: performance.now() });
    snapshot.connections.add(request.socket);
    snapshot.active++;
    snapshot.peak = Math.max(snapshot.peak, snapshot.active);
    let finished = false;
    response.once('close', () => {
      snapshot.active--;
      if (!finished) snapshot.cancelled.push(index);
    });
    if (mode === 'body-timeout' && index === 1) {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.write('{"data":');
      return true;
    }
    if (mode === 'budget' || (mode === 'timeout' && index === 1)) {
      // Never send a response: only real fetch cancellation closes this stream.
      return true;
    }
    await pause(index === 0 ? 80 : 4 + (index % 4) * 5);
    if (response.destroyed) return true;
    if (mode === '502' && index === 1) response.writeHead(502).end(SECRET);
    else {
      const items = Array.from({ length: 6 }, (_, offset) => ({
        ...tileProduct(index * 10 + offset + 1),
        slug: offset === 0 ? 'shared-product' : `ssr-product-${index}-${offset}`,
      }));
      response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ data: { search: { totalItems: 9, items } } }));
    }
    finished = true;
    snapshot.completed.push(index);
    return true;
  }

  async function verify(baseUrl, readLogs) {
    const timings = {};
    for (const scenario of ['happy', '502', 'timeout', 'body-timeout', 'budget', 'empty', 'critical']) {
      reset(scenario);
      const logStart = readLogs().length;
      const started = performance.now();
      const response = await fetch(`${baseUrl}/`, { headers: { 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10_000) });
      const html = await response.text(); // Measure complete HTML, never just headers/TTFB.
      timings[scenario] = Math.round(performance.now() - started);
      await pause(100); // Allow the mock's socket-close callback to run.
      assert.equal(stats.lists, 1, `${scenario}: TC-S5 one list across Header and page`);
      assert.equal(response.status, scenario === 'critical' ? 500 : 200, `${scenario}: HTTP status`);
      assert.match(html, /<\/html>/, `${scenario}: full HTML document`);
      assert.ok(stats.peak <= 4, `${scenario}: TC-S5 peak ${stats.peak} exceeds four active requests`);
      assert.equal(stats.active, 0, `${scenario}: no active mock requests after HTML completes`);
      assert.equal(new Set(stats.starts.map(({ index }) => index)).size, stats.starts.length, `${scenario}: TC-S6 no retries`);
      const logs = readLogs().slice(logStart);
      assert.ok(!logs.includes(SECRET), `${scenario}: TC-S6 no backend secret/payload in logs`);
      assert.doesNotMatch(logs, /collectionSlug|basePriceWithTax|\bvariables\b|\bquery GetAllCollections/, `${scenario}: TC-S6 no GraphQL document or variables in logs`);
      if (scenario === 'critical') {
        assert.match(logs, /\[catalog-ssr\].*"operation":"GetAllCollections".*"category":null.*"errorClass":"Http502"/);
        assert.equal(stats.starts.length, 0);
        continue;
      }
      const jsonLd = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
      const itemList = jsonLd.find((item) => item['@type'] === 'ItemList');
      assert.ok(itemList, `${scenario}: valid JSON-LD ItemList`);
      const unavailable = [...html.matchAll(/data-unavailable-collection="([^"]+)"/g)].map((match) => match[1]);
      if (scenario === 'empty' || scenario === 'budget') {
        assert.deepEqual(itemList.itemListElement, [], `${scenario}: no invented JSON-LD items`);
        assert.doesNotMatch(html, /href="\/products\/ssr-product-/);
      }
      if (scenario === 'empty') {
        assert.equal(stats.starts.length, 0);
        assert.deepEqual(unavailable, []);
      } else if (scenario === 'budget') {
        assert.equal(stats.starts.length, 12, 'TC-S3 two full timeout waves and one deadline-aborted wave; remaining queue must not launch');
        assert.equal(stats.cancelled.length, 12, 'TC-S3 mock observes all active response streams cancelled');
        assert.equal(unavailable.length, 41, 'TC-S3 every failed/queued category degrades honestly');
        assert.ok(stats.connections.size >= 4, 'TC-S3 real network connections were observed');
        const first = stats.starts[0].time;
        assert.ok(
          stats.starts.every(({ time }) => time - first < 5_000),
          'TC-S3 no start beyond global deadline',
        );
        assert.ok(timings[scenario] >= 4_900 && timings[scenario] <= 6_000, `TC-S3/5 bounded complete HTML ${timings[scenario]}ms`);
        const count = stats.starts.length;
        await pause(300);
        assert.equal(stats.starts.length, count, 'TC-S3 queue remains stopped after HTML');
      } else {
        assert.equal(stats.starts.length, 41, `${scenario}: catalogue is not shortened`);
        assert.ok(stats.completed.indexOf(2) < stats.completed.indexOf(0), 'TC-S6 mock responds out of order');
        const expected = slugs.filter((_, index) => scenario === 'happy' || index !== 1);
        assert.deepEqual(
          itemList.itemListElement.map((item) => new URL(item.url).pathname),
          expected.map((slug) => `/collections/${slug}`),
          `${scenario}: TC-S1/6 JSON-LD preserves category links/order`,
        );
        const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
        const categoryLinks = [...main.matchAll(/href="\/collections\/([^"]+)"/g)].map((match) => match[1]);
        assert.deepEqual(categoryLinks, expected, `${scenario}: TC-S1 category HTML links/order preserved`);
        const productLinks = [...main.matchAll(/href="\/products\/([^"]+)"/g)].map((match) => match[1]);
        assert.deepEqual(
          productLinks,
          ['shared-product', ...expected.map((slug) => `ssr-product-${slugs.indexOf(slug)}-1`)],
          `${scenario}: TC-S1 first two per collection, deduplication and order preserved`,
        );
        assert.deepEqual(unavailable, scenario === 'happy' ? [] : [slugs[1]], `${scenario}: TC-S2 only failed block degrades`);
        if (scenario !== 'happy') {
          assert.match(
            logs,
            new RegExp(`\\[catalog-ssr\\].*"operation":"SearchCollectionProducts".*"category":"${slugs[1]}".*"errorClass":"${scenario === '502' ? 'Http502' : 'TimeoutError'}"`),
          );
        }
        if (scenario === 'timeout' || scenario === 'body-timeout') {
          assert.deepEqual(stats.cancelled, [1], 'TC-S3 single timeout cancels actual mock stream');
          assert.ok(timings[scenario] >= 1_900 && timings[scenario] <= 3_000, 'TC-S3 per-request 2s timeout');
        }
      }
      console.log(
        `TC-S ${scenario}: complete HTML ${timings[scenario]}ms, collections=${stats.lists}, searches=${stats.starts.length}, peak=${stats.peak}, cancelled=${stats.cancelled.length}`,
      );
    }
    mode = undefined;
    console.log(`TC-S1..S6 SSR timing comparison (same runtime): ${JSON.stringify(timings)}`);
  }
  return { handle, verify };
}
