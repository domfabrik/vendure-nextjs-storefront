import 'server-only';

import { randomUUID } from 'node:crypto';
import { type CatalogOperation, type CatalogStage, createCatalogLogEmitter, safeCatalogError, wasCatalogErrorObserved } from './catalog-observability-core';

const enabled = process.env.CATALOG_OBSERVABILITY_ENABLED === 'true';
const requestIDSymbol = Symbol.for('domfabrik.catalogRequestID');
const emit = createCatalogLogEmitter({
  enabled,
  slowMs: Number(process.env.CATALOG_OBSERVABILITY_SLOW_MS ?? 1_000),
  maxEventsPerMinute: Number(process.env.CATALOG_OBSERVABILITY_MAX_EVENTS_PER_MINUTE ?? 60),
});

export async function observeCatalogStage<T>(stage: CatalogStage, operation: CatalogOperation, task: () => Promise<T>): Promise<T> {
  if (!enabled) return task();
  const startedAt = performance.now();
  try {
    const result = await task();
    const requestID = catalogRequestID(result) ?? randomUUID();
    emit({ requestID, stage, operation, outcome: 'success', durationMs: performance.now() - startedAt });
    return result;
  } catch (error) {
    const requestID = catalogRequestID(error) ?? randomUUID();
    if (!wasCatalogErrorObserved(error)) emit({ requestID, stage, operation, outcome: 'failure', durationMs: performance.now() - startedAt, error });
    const safeError = safeCatalogError(error);
    attachCatalogRequestID(safeError, requestID);
    throw safeError;
  }
}

export function reportObservedCatalogFailure(stage: CatalogStage, operation: CatalogOperation, error: unknown, durationMs = 0): boolean {
  if (!enabled) return false;
  const requestID = catalogRequestID(error) ?? randomUUID();
  emit({ requestID, stage, operation, outcome: 'failure', durationMs, error });
  return true;
}

export function catalogPropagation(stage: CatalogStage, operation: CatalogOperation): { requestID?: string; headers?: Record<string, string> } {
  if (!enabled) return {};
  const requestID = randomUUID();
  return { requestID, headers: { 'x-fabric-request-id': requestID, 'x-fabric-stage': stage, 'x-fabric-operation': operation } };
}

export function attachCatalogRequestID(value: unknown, requestID: string | undefined): void {
  if (requestID && typeof value === 'object' && value != null) Object.defineProperty(value, requestIDSymbol, { value: requestID });
}

export function inheritCatalogRequestID<T>(value: T, source: unknown): T {
  attachCatalogRequestID(value, catalogRequestID(source));
  return value;
}

function catalogRequestID(value: unknown): string | undefined {
  if (typeof value !== 'object' || value == null) return undefined;
  const requestID = (value as { [requestIDSymbol]?: unknown })[requestIDSymbol];
  return typeof requestID === 'string' ? requestID : undefined;
}
