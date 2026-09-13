import { type Ga4Config, resolveGa4Config } from './ga4-config';
import { getGa4ConsentChoice } from './ga4-consent';

declare global {
  interface Window {
    gaDataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

export interface Ga4CatalogItem {
  variantId: string;
  name: string;
  variant?: string;
  category?: string;
  unitPriceMinor: number;
  quantity: number;
}

export interface Ga4CartItem {
  productVariantId: string;
  productName: string;
  variantName: string;
  price: number;
  quantity: number;
}

export interface Ga4PageContext {
  page_location: string;
  page_referrer: string;
  page_title: string;
}

const DENIED_CONSENT = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
} as const;

const GRANTED_ANALYTICS_CONSENT = {
  ...DENIED_CONSENT,
  analytics_storage: 'granted',
} as const;

const STATIC_PAGE_TITLES: Record<string, string> = {
  '/': 'Главная | Дом Фабрик',
  '/about': 'О компании | Дом Фабрик',
  '/cart': 'Корзина | Дом Фабрик',
  '/contacts': 'Контакты | Дом Фабрик',
  '/delivery': 'Доставка | Дом Фабрик',
  '/how-to-buy': 'Как купить | Дом Фабрик',
  '/juristic/policy': 'Политика обработки персональных данных | Дом Фабрик',
  '/juristic/returns': 'Возврат и обмен | Дом Фабрик',
  '/juristic/terms': 'Условия продажи | Дом Фабрик',
  '/juristic/user-agreement': 'Пользовательское соглашение | Дом Фабрик',
  '/search': 'Поиск | Дом Фабрик',
};

let activeConfig: Ga4Config | null = null;
let lastConfig: Ga4Config | null = null;
let consentGranted = false;
let initializedId: string | null = null;
let lastPagePath: string | null = null;
let lastPageLocation: string | null = null;
let lastPageContext: Ga4PageContext | null = null;

function getRuntimeConfig(): Ga4Config | null {
  return resolveGa4Config(
    typeof window === 'undefined' ? undefined : window.location.hostname,
    process.env.NEXT_PUBLIC_GA4_ID,
    process.env.NEXT_PUBLIC_GA4_ENABLED,
    process.env.NEXT_PUBLIC_GA4_DEBUG,
  );
}

export function isGa4Configured(hostname?: string): boolean {
  return Boolean(
    resolveGa4Config(
      hostname ?? (typeof window === 'undefined' ? undefined : window.location.hostname),
      process.env.NEXT_PUBLIC_GA4_ID,
      process.env.NEXT_PUBLIC_GA4_ENABLED,
      process.env.NEXT_PUBLIC_GA4_DEBUG,
    ),
  );
}

export function sanitizeGa4Path(pathname: string | undefined): string {
  const pathOnly = (pathname ?? '/').split(/[?#]/, 1)[0] || '/';
  if (STATIC_PAGE_TITLES[pathOnly]) return pathOnly;

  const productMatch = /^\/products\/([a-z0-9_-]+)$/.exec(pathOnly);
  if (productMatch) return `/products/${productMatch[1]}`;

  const collectionMatch = /^\/collections\/([a-z0-9_-]+)$/.exec(pathOnly);
  if (collectionMatch) return `/collections/${collectionMatch[1]}`;

  return '/other';
}

function titleForSafePath(pathname: string): string {
  if (pathname.startsWith('/products/')) return 'Товар | Дом Фабрик';
  if (pathname.startsWith('/collections/')) return 'Коллекция | Дом Фабрик';
  return STATIC_PAGE_TITLES[pathname] ?? 'Страница | Дом Фабрик';
}

function safeReferrer(config: Ga4Config, referrer: string | undefined, previousLocation?: string | null): string {
  if (previousLocation) return previousLocation;
  if (!referrer) return '';

  try {
    const parsed = new URL(referrer);
    if (parsed.origin === config.origin) return `${config.origin}${sanitizeGa4Path(parsed.pathname)}`;
    return parsed.origin;
  } catch {
    return '';
  }
}

export function buildSafeGa4PageContext(
  config: Ga4Config,
  pathname: string | undefined,
  referrer: string | undefined,
  previousLocation?: string | null,
): Ga4PageContext & { safePath: string } {
  const safePath = sanitizeGa4Path(pathname);
  return {
    safePath,
    page_location: `${config.origin}${safePath}`,
    page_referrer: safeReferrer(config, referrer, previousLocation),
    page_title: titleForSafePath(safePath),
  };
}

function queueGtagCall(...args: unknown[]): void {
  try {
    if (typeof window.gtag === 'function') window.gtag(...args);
  } catch {
    // Analytics is best effort and must not affect shopping or lead submission.
  }
}

function insertGoogleScript(config: Ga4Config): void {
  try {
    const scriptId = `google-analytics-${config.id}`;
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.id)}&l=gaDataLayer`;
    document.head.appendChild(script);
  } catch {
    // A blocked script or unavailable document must not break the storefront.
  }
}

export function startGa4AfterConsent(): boolean {
  const config = getRuntimeConfig();
  if (!config || getGa4ConsentChoice() !== 'granted' || typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (consentGranted && activeConfig?.id === config.id) return true;

  try {
    window.gaDataLayer ??= [];
    window.gtag = (...args: unknown[]) => window.gaDataLayer?.push(args);

    Object.assign(window, { [`ga-disable-${config.id}`]: false });
    activeConfig = config;
    lastConfig = config;
    consentGranted = true;

    if (initializedId !== config.id) {
      queueGtagCall('consent', 'default', DENIED_CONSENT);
      queueGtagCall('consent', 'update', GRANTED_ANALYTICS_CONSENT);
      queueGtagCall('js', new Date());
      const page = buildSafeGa4PageContext(config, window.location.pathname, document.referrer, lastPageLocation);
      queueGtagCall('config', config.id, {
        ...page,
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_domain: 'none',
        cookie_path: '/',
        ...(config.debug ? { debug_mode: true } : {}),
      });
      initializedId = config.id;
    } else {
      queueGtagCall('consent', 'update', GRANTED_ANALYTICS_CONSENT);
    }

    insertGoogleScript(config);
    return true;
  } catch {
    consentGranted = false;
    activeConfig = null;
    return false;
  }
}

function clearCurrentSiteGaCookies(): void {
  try {
    const names = document.cookie
      .split(';')
      .map((part) => part.trim().split('=', 1)[0])
      .filter((name) => name === '_ga' || name.startsWith('_ga_'));
    for (const name of names) {
      document.cookie = `${name}=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
    }
  } catch {
    // Cookie access can be restricted; revocation still blocks future GA events.
  }
}

export function stopGa4AfterRevocation(): void {
  consentGranted = false;
  activeConfig = null;
  lastPagePath = null;
  lastPageLocation = null;
  lastPageContext = null;
  const config = lastConfig ?? getRuntimeConfig();
  if (config && typeof window !== 'undefined') {
    try {
      Object.assign(window, { [`ga-disable-${config.id}`]: true });
      queueGtagCall('consent', 'update', DENIED_CONSENT);
    } catch {
      // Analytics is best effort and must not affect the user's updated choice.
    }
  }
  if (typeof document !== 'undefined') clearCurrentSiteGaCookies();
}

function currentPageParameters(config: Ga4Config): Ga4PageContext {
  const pathname = typeof window === 'undefined' ? '/' : window.location.pathname;
  const path = sanitizeGa4Path(pathname);
  if (lastPagePath === path && lastPageContext) return lastPageContext;

  const referrer = typeof document === 'undefined' ? '' : document.referrer;
  const context = buildSafeGa4PageContext(config, pathname, referrer, lastPageLocation);
  const { safePath: _safePath, ...page } = context;
  return page;
}

function sendEvent(name: string, parameters: Record<string, unknown>): void {
  if ((!activeConfig || !consentGranted) && getGa4ConsentChoice() === 'granted') startGa4AfterConsent();
  if (!activeConfig || !consentGranted || getGa4ConsentChoice() !== 'granted' || getRuntimeConfig()?.id !== activeConfig.id || typeof window === 'undefined') return;
  if (lastPagePath !== sanitizeGa4Path(window.location.pathname)) trackGa4PageView(window.location.pathname);
  const page = currentPageParameters(activeConfig);
  queueGtagCall('event', name, { ...parameters, ...page });
}

export function trackGa4PageView(pathname: string): void {
  if (!activeConfig || !consentGranted || getGa4ConsentChoice() !== 'granted' || getRuntimeConfig()?.id !== activeConfig.id) return;
  const config = activeConfig;
  const context = buildSafeGa4PageContext(config, pathname, typeof document === 'undefined' ? '' : document.referrer, lastPageLocation);
  if (context.safePath === lastPagePath) return;

  lastPagePath = context.safePath;
  lastPageLocation = context.page_location;
  lastPageContext = { page_location: context.page_location, page_referrer: context.page_referrer, page_title: context.page_title };
  sendEvent('page_view', { ...lastPageContext });
}

function safeCatalogText(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const text = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\p{Cc}/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
  return text || undefined;
}

function toMoney(minor: number): number | undefined {
  if (!Number.isFinite(minor) || minor < 0) return undefined;
  return Math.round(minor) / 100;
}

function buildItem(item: Ga4CatalogItem): Record<string, unknown> | null {
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(item.variantId) || !Number.isInteger(item.quantity) || item.quantity <= 0) return null;
  const itemName = safeCatalogText(item.name);
  const price = toMoney(item.unitPriceMinor);
  if (!itemName || price === undefined) return null;

  const result: Record<string, unknown> = { item_id: item.variantId, item_name: itemName, price, quantity: item.quantity };
  const variant = safeCatalogText(item.variant);
  const category = safeCatalogText(item.category);
  if (variant) result.item_variant = variant;
  if (category) result.item_category = category;
  return result;
}

export function trackGa4ViewItem(item: Omit<Ga4CatalogItem, 'quantity'>): void {
  const gaItem = buildItem({ ...item, quantity: 1 });
  if (!gaItem) return;
  const price = toMoney(item.unitPriceMinor);
  if (price === undefined) return;
  sendEvent('view_item', { currency: 'RUB', value: price, items: [gaItem] });
}

function trackCartDelta(event: 'add_to_cart' | 'remove_from_cart', item: Ga4CartItem, quantity: number): void {
  const gaItem = buildItem({
    variantId: item.productVariantId,
    name: item.productName,
    variant: item.variantName,
    unitPriceMinor: item.price,
    quantity,
  });
  if (!gaItem) return;
  const price = toMoney(item.price);
  if (price === undefined) return;
  sendEvent(event, { currency: 'RUB', value: Math.round(price * quantity * 100) / 100, items: [gaItem] });
}

export function trackGa4AddToCart(item: Ga4CartItem, quantity: number): void {
  trackCartDelta('add_to_cart', item, quantity);
}

export function trackGa4RemoveFromCart(item: Ga4CartItem, quantity: number): void {
  trackCartDelta('remove_from_cart', item, quantity);
}

export function trackGa4BeginCheckout(items: readonly Ga4CartItem[]): void {
  const gaItems = items
    .map((item) =>
      buildItem({
        variantId: item.productVariantId,
        name: item.productName,
        variant: item.variantName,
        unitPriceMinor: item.price,
        quantity: item.quantity,
      }),
    )
    .filter((item): item is Record<string, unknown> => item !== null);
  if (gaItems.length === 0) return;

  const value = gaItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  sendEvent('begin_checkout', { currency: 'RUB', value: Math.round(value * 100) / 100, items: gaItems });
}

const submittedLeadIds = new Set<string>();
const SUBMITTED_LEADS_KEY = 'ga4-generated-lead-order-ids-v1';

function markLeadOnce(orderId: string): boolean {
  if (!orderId || submittedLeadIds.has(orderId)) return false;
  submittedLeadIds.add(orderId);

  try {
    const previous: unknown = JSON.parse(window.localStorage.getItem(SUBMITTED_LEADS_KEY) ?? '[]');
    const ids = Array.isArray(previous) ? previous.filter((value): value is string => typeof value === 'string') : [];
    if (ids.includes(orderId)) return false;
    window.localStorage.setItem(SUBMITTED_LEADS_KEY, JSON.stringify([...ids.slice(-99), orderId]));
  } catch {
    // The in-memory set still prevents repeats when storage is blocked.
  }
  return true;
}

export function trackGa4GenerateLead(receipt: { orderId: string; totalWithTax: number; currencyCode: string }): void {
  if (!receipt || receipt.currencyCode !== 'RUB' || toMoney(receipt.totalWithTax) === undefined || getGa4ConsentChoice() !== 'granted') return;
  if (!markLeadOnce(receipt.orderId)) return;
  const value = toMoney(receipt.totalWithTax);
  if (value === undefined) return;
  sendEvent('generate_lead', { currency: 'RUB', value });
}
