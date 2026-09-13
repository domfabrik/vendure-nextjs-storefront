export type Ga4ConsentChoice = 'granted' | 'denied';

export const GA4_CONSENT_STORAGE_KEY = 'google-analytics-consent-v1';
export const GA4_CONSENT_CHANGE_EVENT = 'ga4-consent-change';

let memoryChoice: Ga4ConsentChoice | null = null;

export function getGa4ConsentChoice(): Ga4ConsentChoice | null {
  if (typeof window === 'undefined') return memoryChoice;

  try {
    const stored = window.localStorage.getItem(GA4_CONSENT_STORAGE_KEY);
    if (stored === 'granted' || stored === 'denied') {
      memoryChoice = stored;
      return stored;
    }
    memoryChoice = null;
    return null;
  } catch {
    return memoryChoice;
  }
}

export function setGa4ConsentChoice(choice: Ga4ConsentChoice): void {
  memoryChoice = choice;
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(GA4_CONSENT_STORAGE_KEY, choice);
  } catch {
    // Keep the decision for this page even when browser storage is unavailable.
  }

  window.dispatchEvent(new Event(GA4_CONSENT_CHANGE_EVENT));
}
