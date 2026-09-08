function currencyToken(currencyCode) {
  const currency = String(currencyCode ?? '')
    .trim()
    .toUpperCase();
  if (currency === 'RUB') return '(?:₽|RUB|руб\\.?)';
  return currency.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseMoneyMinorValues(text, currencyCode = 'RUB') {
  const pattern = new RegExp(`(\\d[\\d \\u00a0\\u202f]*(?:[,.]\\d{1,2})?)[ \\u00a0\\u202f]*${currencyToken(currencyCode)}`, 'giu');
  const values = [...String(text).matchAll(pattern)].map((match) => {
    const value = Number(match[1].replace(/[ \u00a0\u202f]/g, '').replace(',', '.'));
    if (!Number.isFinite(value)) throw new Error(`invalid displayed ${currencyCode} price`);
    return Math.round(value * 100);
  });
  if (!values.length) throw new Error(`cart text does not contain a ${currencyCode} price`);
  return values;
}

export function validateCartMoneyText(text, { currencyCode = 'RUB', unitMinor, quantity = 1 } = {}) {
  if (!Number.isSafeInteger(unitMinor) || unitMinor < 0) throw new Error('expected cart price must be a non-negative minor-unit integer');
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error('expected cart quantity must be a positive integer');
  const values = parseMoneyMinorValues(text, currencyCode);
  if (values[0] !== unitMinor) throw new Error(`cart unit price minor mismatch: expected ${unitMinor}, got ${values[0]}`);
  const totalMinor = values.at(-1);
  if (totalMinor !== unitMinor * quantity) throw new Error(`cart total minor mismatch: expected ${unitMinor * quantity}, got ${totalMinor}`);
  return { currencyCode: String(currencyCode).toUpperCase(), values, unitMinor: values[0], totalMinor };
}

export function validatePaginationShape({ totalItems, pageSize, page2Href }) {
  if (!Number.isSafeInteger(totalItems) || totalItems < 0) throw new Error('pagination totalItems must be a non-negative integer');
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) throw new Error('pagination pageSize must be a positive integer');
  const multiPage = totalItems > pageSize;
  if (multiPage && !page2Href) throw new Error('multi-page category must expose a page 2 link');
  if (!multiPage && page2Href) throw new Error('single-page category must not expose a page 2 link');
  return { multiPage, totalItems, pageSize };
}

export function matchesCollectionPage(href, selectedHref, page) {
  try {
    const candidate = new URL(href, 'http://acceptance.invalid');
    const selected = new URL(selectedHref, 'http://acceptance.invalid');
    return candidate.pathname === selected.pathname && candidate.searchParams.get('page') === String(page);
  } catch {
    return false;
  }
}
