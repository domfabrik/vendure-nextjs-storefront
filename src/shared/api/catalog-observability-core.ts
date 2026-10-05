export const CATALOG_STAGES = ['product', 'metadata', 'header', 'recommendations'] as const;
export const CATALOG_OPERATIONS = ['GetProductBySlug', 'GetAllCollections', 'SearchCollectionProducts'] as const;

export type CatalogStage = (typeof CATALOG_STAGES)[number];
export type CatalogOperation = (typeof CATALOG_OPERATIONS)[number];

interface CatalogRecordInput {
  requestID: string;
  stage: CatalogStage;
  operation: CatalogOperation;
  outcome: 'success' | 'failure';
  durationMs: number;
  error?: unknown;
}

interface CatalogLogEmitterOptions {
  enabled: boolean;
  slowMs: number;
  maxEventsPerMinute: number;
  now?: () => number;
  write?: (line: string) => void;
}

export function createCatalogLogEmitter(options: CatalogLogEmitterOptions) {
  const now = options.now ?? Date.now;
  const write = options.write ?? ((line: string) => console.warn(line));
  const slowMs = boundedInteger(options.slowMs, 100, 60_000, 1_000);
  const maxEventsPerMinute = boundedInteger(options.maxEventsPerMinute, 1, 600, 60);
  let windowStartedAt = now();
  let emitted = 0;

  return (input: CatalogRecordInput): boolean => {
    if (!options.enabled) return false;
    const durationMs = Math.max(0, Math.round(Number.isFinite(input.durationMs) ? input.durationMs : 0));
    if (input.outcome === 'success' && durationMs < slowMs) return false;

    const current = now();
    if (current - windowStartedAt >= 60_000) {
      windowStartedAt = current;
      emitted = 0;
    }
    if (emitted >= maxEventsPerMinute) return false;
    emitted += 1;

    const record: Record<string, string | number> = {
      schemaVersion: 1,
      event: 'catalog-stage',
      requestID: isRequestID(input.requestID) ? input.requestID : 'invalid-request-id',
      stage: input.stage,
      operation: input.operation,
      outcome: input.outcome,
      durationMs,
    };
    if (input.outcome === 'failure') record.errorClass = classifyCatalogError(input.error);
    write(`[catalog-observability] ${JSON.stringify(record)}`);
    return true;
  };
}

export function classifyCatalogError(error: unknown): string {
  if (typeof error === 'object' && error != null && 'catalogErrorClass' in error) {
    const safeClass = (error as { catalogErrorClass?: unknown }).catalogErrorClass;
    if (typeof safeClass === 'string' && ['Http4xx', 'Http5xx', 'HttpError', 'TimeoutError', 'AbortError', 'RequestError'].includes(safeClass)) return safeClass;
  }
  const status = getHttpStatus(error);
  if (status != null) return status >= 500 ? 'Http5xx' : status >= 400 ? 'Http4xx' : 'HttpError';
  if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) return error.name;
  return 'RequestError';
}

export function safeCatalogError(error: unknown): Error {
  const safeError = new Error('Catalog stage failed');
  Object.defineProperty(safeError, 'catalogErrorClass', { value: classifyCatalogError(error) });
  Object.defineProperty(safeError, 'catalogObserved', { value: true });
  return safeError;
}

export function wasCatalogErrorObserved(error: unknown): boolean {
  return typeof error === 'object' && error != null && 'catalogObserved' in error && (error as { catalogObserved?: unknown }).catalogObserved === true;
}

export function isRequestID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getHttpStatus(error: unknown): number | null {
  if (typeof error !== 'object' || error == null || !('response' in error)) return null;
  const response = (error as { response?: { status?: unknown } }).response;
  return typeof response?.status === 'number' ? response.status : null;
}

function boundedInteger(value: number, minimum: number, maximum: number, fallback: number): number {
  return Number.isInteger(value) && value >= minimum && value <= maximum ? value : fallback;
}
