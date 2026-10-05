import { reportObservedCatalogFailure } from '../catalog-observability';
import { classifyCatalogError, wasCatalogErrorObserved } from '../catalog-observability-core';

// Homepage secondary work shares one deadline; each fetch also has its own limit.
export const HOMEPAGE_PRODUCT_CONCURRENCY = 4;
export const HOMEPAGE_SECONDARY_BUDGET_MS = 5_000;
export const CATALOG_REQUEST_TIMEOUT_MS = 2_000;

export function reportCatalogFailure(operation: 'GetAllCollections' | 'SearchCollectionProducts', category: string | null, error: unknown, durationMs = 0) {
  void category;
  if (wasCatalogErrorObserved(error)) return;
  const stage = operation === 'GetAllCollections' ? 'header' : operation === 'SearchCollectionProducts' ? 'recommendations' : null;
  if (!stage) return;
  if (!reportObservedCatalogFailure(stage, operation, error, durationMs)) {
    console.warn('[catalog-ssr]', JSON.stringify({ operation, errorClass: classifyCatalogError(error) }));
  }
}

export async function loadSecondaryCollections<T, R>(items: T[], load: (item: T, signal: AbortSignal) => Promise<R>): Promise<(R | null)[]> {
  const startedAt = performance.now();
  const deadline = startedAt + HOMEPAGE_SECONDARY_BUDGET_MS;
  const budget = new AbortController();
  const deadlineTimer = setTimeout(() => budget.abort(new DOMException('Secondary deadline', 'TimeoutError')), HOMEPAGE_SECONDARY_BUDGET_MS);
  const results: (R | null)[] = Array.from({ length: items.length }, () => null);
  let firstFailure: unknown;
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
        firstFailure ??= signal.aborted ? signal.reason : error;
      } finally {
        clearTimeout(timer);
      }
    }
  }
  try {
    await Promise.all(Array.from({ length: Math.min(HOMEPAGE_PRODUCT_CONCURRENCY, items.length) }, worker));
    for (let index = cursor; index < items.length; index++) {
      firstFailure ??= new DOMException('Secondary deadline', 'TimeoutError');
    }
    if (firstFailure) reportCatalogFailure('SearchCollectionProducts', null, firstFailure, performance.now() - startedAt);
    return results;
  } finally {
    clearTimeout(deadlineTimer);
  }
}
