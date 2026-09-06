import type { SubmitOrderInput } from '@/shared/api';

const STORAGE_KEY = 'lead-checkout-attempt-v1';
const COMPLETED_STORAGE_KEY = 'lead-checkout-completed-v1';
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CAPABILITY = /^[0-9a-f]{64}$/;
const COMPLETED_TOKEN_LIMIT = 100;

export interface LeadCheckoutAttempt {
  version: 1;
  input: SubmitOrderInput;
}

let memoryAttempt: LeadCheckoutAttempt | null = null;
const completedTokens = new Set<string>();

function loadCompletedTokens(): void {
  try {
    const raw = window.localStorage.getItem(COMPLETED_STORAGE_KEY);
    if (!raw) return;
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return;
    for (const token of value) if (typeof token === 'string' && UUID_V4.test(token)) completedTokens.add(token);
  } catch {
    // The in-document completion guard remains available when storage cannot be read.
  }
}

function persistCompletedToken(submissionToken: string): void {
  loadCompletedTokens();
  completedTokens.delete(submissionToken);
  completedTokens.add(submissionToken);
  try {
    window.localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify([...completedTokens].slice(-COMPLETED_TOKEN_LIMIT)));
  } catch {
    // Same-document reads still reject the completed token when persistent writes are unavailable.
  }
}

function isAttempt(value: unknown): value is LeadCheckoutAttempt {
  if (!value || typeof value !== 'object') return false;
  const attempt = value as Partial<LeadCheckoutAttempt>;
  const input = attempt.input;
  return (
    attempt.version === 1 &&
    !!input &&
    UUID_V4.test(input.submissionToken) &&
    CAPABILITY.test(input.sessionCapability) &&
    Array.isArray(input.items) &&
    input.items.length > 0 &&
    input.items.every((item) => typeof item.productVariantId === 'string' && Number.isInteger(item.quantity) && item.quantity > 0) &&
    typeof input.contact?.fullName === 'string' &&
    typeof input.contact?.phone === 'string'
  );
}

function createUuidV4(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function createLeadCheckoutAttempt(input: Omit<SubmitOrderInput, 'submissionToken'>): LeadCheckoutAttempt {
  return { version: 1, input: { ...input, submissionToken: createUuidV4() } };
}

export function loadLeadCheckoutAttempt(): LeadCheckoutAttempt | null {
  loadCompletedTokens();
  if (memoryAttempt) return completedTokens.has(memoryAttempt.input.submissionToken) ? null : memoryAttempt;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!isAttempt(value)) return null;
    if (completedTokens.has(value.input.submissionToken)) return null;
    memoryAttempt = value;
    return value;
  } catch {
    return null;
  }
}

export function saveLeadCheckoutAttempt(attempt: LeadCheckoutAttempt): void {
  memoryAttempt = attempt;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));
  } catch {
    // The in-document copy still protects retries and React remounts when storage is unavailable.
  }
}

export function clearLeadCheckoutAttempt(submissionToken: string): void {
  persistCompletedToken(submissionToken);
  if (memoryAttempt?.input.submissionToken === submissionToken) memoryAttempt = null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const value: unknown = JSON.parse(raw);
    if (isAttempt(value) && value.input.submissionToken === submissionToken) window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // A successful checkout must not be turned into a failure by browser storage.
  }
}
