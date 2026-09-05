import { ClientError } from 'graphql-request';

// Homepage secondary work shares one deadline; each fetch also has its own limit.
export const HOMEPAGE_PRODUCT_CONCURRENCY = 4;
export const HOMEPAGE_SECONDARY_BUDGET_MS = 5_000;
export const CATALOG_REQUEST_TIMEOUT_MS = 2_000;

export function reportCatalogFailure(operation: string, category: string | null, error: unknown) {
  const errorClass =
    error instanceof ClientError
      ? `Http${error.response.status}`
      : error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
        ? error.name
        : 'RequestError';
  // Never include ClientError.message/stack: graphql-request embeds payloads there.
  console.warn('[catalog-ssr]', JSON.stringify({ operation, category, errorClass }));
}

export async function loadSecondaryCollections<T, R>(items: T[], load: (item: T, signal: AbortSignal) => Promise<R>, category: (item: T) => string): Promise<(R | null)[]> {
  const deadline = performance.now() + HOMEPAGE_SECONDARY_BUDGET_MS;
  const budget = new AbortController();
  const deadlineTimer = setTimeout(() => budget.abort(new DOMException('Secondary deadline', 'TimeoutError')), HOMEPAGE_SECONDARY_BUDGET_MS);
  const results: (R | null)[] = Array.from({ length: items.length }, () => null);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length && !budget.signal.aborted && performance.now() < deadline) {
      const index = cursor++;
      const request = new AbortController();
      const timer = setTimeout(() => request.abort(new DOMException('Request deadline', 'TimeoutError')), CATALOG_REQUEST_TIMEOUT_MS);
      const signal = AbortSignal.any([budget.signal, request.signal]);
      try {
        results[index] = await load(items[index], signal);
      } catch (error) {
        reportCatalogFailure('SearchCollectionProducts', category(items[index]), signal.aborted ? signal.reason : error);
      } finally {
        clearTimeout(timer);
      }
    }
  }
  try {
    await Promise.all(Array.from({ length: Math.min(HOMEPAGE_PRODUCT_CONCURRENCY, items.length) }, worker));
    for (let index = cursor; index < items.length; index++) {
      reportCatalogFailure('SearchCollectionProducts', category(items[index]), new DOMException('Secondary deadline', 'TimeoutError'));
    }
    return results;
  } finally {
    clearTimeout(deadlineTimer);
  }
}
