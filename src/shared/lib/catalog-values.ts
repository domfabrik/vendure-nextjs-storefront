export type CatalogStockState = {
  kind: 'in-stock' | 'low-stock' | 'out-of-stock' | 'unknown';
  purchasable: boolean;
  quantity?: number;
  schemaAvailability?: 'https://schema.org/InStock' | 'https://schema.org/OutOfStock';
};

const UNKNOWN_STOCK: CatalogStockState = { kind: 'unknown', purchasable: false };

export function normalizeCatalogStock(value: unknown): CatalogStockState {
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (normalized === 'IN_STOCK') {
      return { kind: 'in-stock', purchasable: true, schemaAvailability: 'https://schema.org/InStock' };
    }
    if (normalized === 'LOW_STOCK') {
      return { kind: 'low-stock', purchasable: true, schemaAvailability: 'https://schema.org/InStock' };
    }
    if (normalized === 'OUT_OF_STOCK') {
      return { kind: 'out-of-stock', purchasable: false, schemaAvailability: 'https://schema.org/OutOfStock' };
    }
    if (!/^[0-9]+$/.test(normalized)) return UNKNOWN_STOCK;
    value = Number(normalized);
  }

  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) return UNKNOWN_STOCK;
  if (value === 0) {
    return { kind: 'out-of-stock', purchasable: false, quantity: 0, schemaAvailability: 'https://schema.org/OutOfStock' };
  }
  if (value <= 10) {
    return { kind: 'low-stock', purchasable: true, quantity: value, schemaAvailability: 'https://schema.org/InStock' };
  }
  return { kind: 'in-stock', purchasable: true, quantity: value, schemaAvailability: 'https://schema.org/InStock' };
}

export function normalizeMinorPrice(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}

export function normalizeCurrencyCode(value: unknown): 'RUB' | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toUpperCase();
  return normalized === 'RUB' ? normalized : undefined;
}

export function normalizeCatalogBrand(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}
