import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { delimiter, join } from 'node:path';
import { chromium } from 'playwright-core';

function browserExecutable() {
  const override = process.env.BROWSER_PATH ?? process.env.CHROME_PATH ?? process.env.EDGE_PATH;
  const candidates = override
    ? [override]
    : process.platform === 'win32'
      ? [
          'C:/Program Files/Google/Chrome/Application/chrome.exe',
          'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
          'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
          'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
        ]
      : [
          '/usr/bin/google-chrome',
          '/usr/bin/google-chrome-stable',
          '/usr/bin/chromium',
          '/usr/bin/chromium-browser',
          ...(process.env.PATH ?? '').split(delimiter).flatMap((directory) => [join(directory, 'google-chrome'), join(directory, 'chromium')]),
        ];
  const executable = candidates.find((candidate) => existsSync(candidate));
  assert.ok(executable, `Chromium not found; set BROWSER_PATH${override ? ` (invalid: ${override})` : ''}`);
  return executable;
}

async function viewItemEvents(page) {
  return page.evaluate(() => (window.gaDataLayer ?? []).map((entry) => Array.from(entry)).filter((entry) => entry[0] === 'event' && entry[1] === 'view_item'));
}

export async function runPriceNotSpecifiedBrowserTest(baseUrl) {
  const browser = await chromium.launch({
    executablePath: browserExecutable(),
    headless: true,
    args: ['--no-sandbox', '--no-proxy-server', '--host-resolver-rules=MAP test.domfabrik.ru 127.0.0.1'],
  });

  try {
    const context = await browser.newContext();
    await context.route(/(?:googletagmanager\.com|google-analytics\.com|mc\.yandex\.|yastatic\.net)/, (route) => route.abort());
    await context.addInitScript(() => {
      localStorage.setItem('google-analytics-consent-v1', 'granted');
    });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/products/mixed-price?variant=missing-price`, { waitUntil: 'domcontentloaded' });

    const missingOption = page.getByRole('button', { name: 'Без цены', exact: true });
    const pricedOption = page.getByRole('button', { name: 'С ценой', exact: true });
    await missingOption.waitFor();
    await page.getByTestId('price-not-specified').waitFor();
    await page.waitForFunction(() => Array.isArray(window.gaDataLayer));

    assert.equal(await page.getByTestId('add-to-cart').count(), 0, 'missing-price variant hides cart after hydration');
    assert.equal(await page.getByTestId('discount').count(), 0, 'missing-price variant hides discount after hydration');
    assert.equal(await page.getByTestId('old-price').count(), 0, 'missing-price variant hides old price after hydration');
    assert.equal(await page.getByTestId('stock-status').count(), 0, 'missing-price variant hides stock assurance after hydration');
    assert.equal((await viewItemEvents(page)).length, 0, 'missing-price variant emits no GA4 view_item');

    const missingOptionStyle = await missingOption.evaluate((element) => {
      const style = getComputedStyle(element);
      return { opacity: style.opacity, textDecorationLine: style.textDecorationLine };
    });
    assert.equal(missingOptionStyle.opacity, '1', 'flagged OUT_OF_STOCK option is not dimmed');
    assert.doesNotMatch(missingOptionStyle.textDecorationLine, /line-through/, 'flagged OUT_OF_STOCK option is not struck through');

    await pricedOption.click();
    await page.getByTestId('current-price').waitFor();
    assert.match(await page.getByTestId('current-price').innerText(), /120/, 'priced variant shows its current price');
    assert.match(await page.getByTestId('old-price').innerText(), /150/, 'priced variant shows its old price');
    assert.equal(await page.getByTestId('discount').innerText(), '-20%', 'priced variant shows its discount');
    assert.equal(await page.getByTestId('stock-status').innerText(), 'В наличии', 'priced variant restores stock state');
    assert.equal(await page.getByTestId('add-to-cart').count(), 1, 'priced variant restores cart control');
    await page.waitForFunction(() => (window.gaDataLayer ?? []).map((entry) => Array.from(entry)).some((entry) => entry[0] === 'event' && entry[1] === 'view_item'));
    const pricedEvents = await viewItemEvents(page);
    const pricedEvent = pricedEvents.at(-1);
    assert.equal(pricedEvent?.[2]?.value, 120, 'priced variant emits its GA4 value');
    assert.equal(pricedEvent?.[2]?.items?.[0]?.item_id, 'regular-price', 'priced variant emits its GA4 variant id');

    await missingOption.click();
    await page.getByTestId('price-not-specified').waitFor();
    assert.equal(await page.getByTestId('current-price').count(), 0, 'switching back removes the numeric price');
    assert.equal(await page.getByTestId('old-price').count(), 0, 'switching back removes the old price');
    assert.equal(await page.getByTestId('discount').count(), 0, 'switching back removes the discount');
    assert.equal(await page.getByTestId('stock-status').count(), 0, 'switching back removes stock assurance');
    assert.equal(await page.getByTestId('add-to-cart').count(), 0, 'switching back removes cart control');
    await page.waitForTimeout(250);
    assert.equal((await viewItemEvents(page)).length, pricedEvents.length, 'switching back emits no zero-price GA4 event');

    await context.close();
    console.log('Hydrated missing-price variant switching and GA4 checks passed');
  } finally {
    await browser.close();
  }
}
