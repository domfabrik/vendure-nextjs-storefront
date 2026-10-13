const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STORAGE_PREFIX = 'description-study-session:v1:';

export function isStudySessionId(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID_V4.test(value);
}

export function studySessionStorageKey(experimentKey: string): string {
  return `${STORAGE_PREFIX}${experimentKey}`;
}

export function resolveStudySessionId(options: { search: string; experimentKey: string; storage?: Pick<Storage, 'getItem'> | null; randomUUID: () => string }): {
  studySessionId: string;
  suppliedUrlId: boolean;
  storageAvailable: boolean;
} {
  const params = new URLSearchParams(options.search);
  const suppliedValues = params.getAll('sessionId');
  if (suppliedValues.length > 1) throw new Error('INVALID_STUDY_SESSION_ID');
  const supplied = suppliedValues[0] ?? null;
  if (supplied !== null && !isStudySessionId(supplied)) throw new Error('INVALID_STUDY_SESSION_ID');
  let stored: string | null = null;
  let storageAvailable = Boolean(options.storage);
  try {
    stored = options.storage?.getItem(studySessionStorageKey(options.experimentKey)) ?? null;
  } catch {
    storageAvailable = false;
  }
  const studySessionId = supplied ?? (isStudySessionId(stored) ? stored : options.randomUUID());
  if (!isStudySessionId(studySessionId)) throw new Error('INVALID_STUDY_SESSION_ID');
  return {
    studySessionId,
    suppliedUrlId: supplied !== null,
    storageAvailable,
  };
}

export function continuationUrl(href: string, studySessionId: string): string {
  const url = new URL(href);
  url.searchParams.set('sessionId', studySessionId);
  return url.toString();
}

export function canonicalizeContinuationUrl(href: string, studySessionId: string): string {
  const url = new URL(href);
  if (url.searchParams.get('sessionId') === studySessionId) return href;
  url.searchParams.set('sessionId', studySessionId);
  return `${url.pathname}${url.search}${url.hash}`;
}
