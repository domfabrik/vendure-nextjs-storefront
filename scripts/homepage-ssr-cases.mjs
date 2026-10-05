import assert from 'node:assert/strict';

const SECRET = 'SSR_SECRET_PAYLOAD_SENTINEL';
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function homepageFixture(tileProduct) {
  let mode;
  let stats;
  const reset = (scenario) => {
    mode = scenario;
    stats = {
      lists: 0,
      serverOpen: 0,
      serverPeak: 0,
      starts: [],
      requestBodyAborted: [],
      cancelled: [],
      serverCloses: [],
      completed: [],
      connections: new Set(),
    };
  };
  const slugs = Array.from({ length: 41 }, (_, index) => `ssr-category-${index}`);
  async function handle(query, variables, response, request) {
    if (!mode) return false;
    const snapshot = stats;
    if (query.includes('GetAllCollections')) {
      snapshot.lists++;
      if (mode === 'critical') {
        await pause(150);
        response.writeHead(502).end(SECRET);
      } else {
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
    snapshot.serverOpen++;
    snapshot.serverPeak = Math.max(snapshot.serverPeak, snapshot.serverOpen);
    let finished = false;
    request.once('aborted', () => {
      // IncomingMessage.aborted only describes an interrupted request body. A fully received POST
      // whose response is later cancelled may close without this event.
      snapshot.requestBodyAborted.push(index);
    });
    response.once('close', () => {
      snapshot.serverOpen--;
      snapshot.serverCloses.push(index);
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
      await fetch(`${baseUrl}/api/revalidate`, { signal: AbortSignal.timeout(5_000) }).catch(() => {});
      const logStart = readLogs().length;
      const started = performance.now();
      const response = await fetch(`${baseUrl}/`, { headers: { 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10_000) });
      const html = await response.text(); // Measure complete HTML, never just headers/TTFB.
      timings[scenario] = Math.round(performance.now() - started);
      const drainDeadline = performance.now() + 1_000;
      while (stats.serverOpen !== 0 && performance.now() < drainDeadline) await pause(10);
      assert.equal(stats.lists, 1, `${scenario}: TC-S5 one list across Header and page`);
      assert.equal(response.status, scenario === 'critical' ? 500 : 200, `${scenario}: HTTP status`);
      assert.match(html, /<\/html>/, `${scenario}: full HTML document`);
      assert.equal(stats.serverOpen, 0, `${scenario}: no open mock responses after bounded drain`);
      assert.equal(new Set(stats.starts.map(({ index }) => index)).size, stats.starts.length, `${scenario}: TC-S6 no retries`);
      const logs = readLogs().slice(logStart);
      const records = [...logs.matchAll(/\[catalog-observability\] (\{[^\n]+\})/g)].map((match) => JSON.parse(match[1]));
      assert.ok(!logs.includes(SECRET), `${scenario}: TC-S6 no backend secret/payload in logs`);
      assert.doesNotMatch(logs, /collectionSlug|basePriceWithTax|\bvariables\b|\bquery GetAllCollections/, `${scenario}: TC-S6 no GraphQL document or variables in logs`);
      if (scenario === 'critical') {
        assert.match(logs, /\[catalog-observability\].*"stage":"header".*"operation":"GetAllCollections".*"errorClass":"Http5xx"/);
        const record = records.find((entry) => entry.stage === 'header' && entry.operation === 'GetAllCollections' && entry.outcome === 'failure');
        assert.ok(record?.durationMs >= 100 && record.durationMs <= 500, `critical: measured header failure duration ${record?.durationMs}`);
        assert.equal(stats.starts.length, 0);
        continue;
      }
      const jsonLd = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
      const itemList = jsonLd.find((item) => item['@type'] === 'ItemList');
      assert.ok(itemList, `${scenario}: valid JSON-LD ItemList`);
      if (scenario === 'empty' || scenario === 'budget') {
        assert.deepEqual(itemList.itemListElement, [], `${scenario}: no invented JSON-LD items`);
      }
      if (scenario === 'empty') {
        assert.equal(stats.starts.length, 0);
      } else if (scenario === 'budget') {
        assert.equal(stats.starts.length, 12, 'TC-S3 two full timeout waves and one deadline-aborted wave; remaining queue must not launch');
        assert.equal(stats.cancelled.length, 12, 'TC-S3 mock observes all active response streams cancelled');
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
        // New layout uses Suspense + streaming SSR: product content is streamed after </main>.
        // Verify product links exist anywhere in the complete HTML (deduped across collections).
        const productLinks = [...html.matchAll(/href="\/products\/([^"]+)"/g)].map((match) => match[1]);
        assert.ok(productLinks.length > 0, `${scenario}: TC-S1 product links present in streamed HTML`);
        assert.ok(productLinks[0].startsWith('shared-product'), `${scenario}: TC-S1 deduplication preserves first shared product`);
        if (scenario !== 'happy') {
          assert.match(
            logs,
            new RegExp(
              `\\[catalog-observability\\].*"stage":"recommendations".*"operation":"SearchCollectionProducts".*"errorClass":"${scenario === '502' ? 'Http5xx' : 'TimeoutError'}"`,
            ),
          );
          const record = records.find((entry) => entry.stage === 'recommendations' && entry.operation === 'SearchCollectionProducts' && entry.outcome === 'failure');
          const minimumDuration = scenario === '502' ? 50 : scenario === 'budget' ? 4_900 : 1_900;
          const maximumDuration = scenario === '502' ? 1_000 : scenario === 'budget' ? 6_000 : 3_000;
          assert.ok(record?.durationMs >= minimumDuration && record.durationMs <= maximumDuration, `${scenario}: measured recommendation batch duration ${record?.durationMs}`);
        }
        if (scenario === 'timeout' || scenario === 'body-timeout') {
          assert.deepEqual(stats.cancelled, [1], 'TC-S3 single timeout cancels actual mock stream');
          assert.ok(timings[scenario] >= 1_900 && timings[scenario] <= 3_000, 'TC-S3 per-request 2s timeout');
        }
      }
      console.log(
        `TC-S ${scenario}: complete HTML ${timings[scenario]}ms, collections=${stats.lists}, searches=${stats.starts.length}, serverPeak=${stats.serverPeak}, cancelled=${stats.cancelled.length}, requestBodyAborted=${stats.requestBodyAborted.length}`,
      );
    }
    mode = undefined;
    console.log(`TC-S1..S6 SSR timing comparison (same runtime): ${JSON.stringify(timings)}`);
  }
  return { handle, verify };
}
