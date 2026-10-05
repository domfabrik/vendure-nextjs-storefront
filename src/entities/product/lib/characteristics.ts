import type { ProductCustomFields, ProductVariantCustomFields } from '@/shared/api';

export interface CharacteristicRow {
  label: string;
  value: string;
}

export interface CharacteristicGroup {
  title: string;
  rows: CharacteristicRow[];
}

type DimensionValue = {
  width?: number | null;
  depth?: number | null;
  height?: number | null;
};

export function isDimensionValue(value: unknown): value is DimensionValue {
  return typeof value === 'object' && value !== null && ('width' in value || 'depth' in value || 'height' in value);
}

export function formatDimensionParts(value: DimensionValue): string {
  const parts = [value.width != null ? `Ш ${value.width}` : null, value.depth != null ? `Г ${value.depth}` : null, value.height != null ? `В ${value.height}` : null].filter(
    Boolean,
  );

  return parts.length ? `${parts.join(' × ')} мм` : '';
}

export function safeParseDimensions(value: string): DimensionValue | null {
  const trimmed = value.trim();

  if (!trimmed.startsWith('{') || !trimmed.includes('"width"')) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return isDimensionValue(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function formatDimensionValue(value: string | DimensionValue): string {
  if (isDimensionValue(value)) {
    return formatDimensionParts(value);
  }

  const parsed = safeParseDimensions(value);
  if (parsed) {
    return formatDimensionParts(parsed);
  }

  return value;
}

export function formatValue(key: string, value: string | number | DimensionValue): string {
  if (key === 'dimensionsMm' || key === 'countertopDimensionsMm' || key === 'bedDimensionsMm') {
    return formatDimensionValue(value as string | DimensionValue);
  }

  const suffixes: Record<string, string> = {
    weightKg: ' кг',
    volumeM3: ' м³',
    warrantyMonths: ' мес.',
    maxLoadKg: ' кг',
    minimumDoorWidthCm: ' см',
    recommendedMattressHeightMm: ' мм',
    mattressInsetMm: ' мм',
  };

  const suffix = suffixes[key] ?? '';
  return `${value}${suffix}`;
}

export const productLabels: Record<string, string> = {
  vendorName: 'Производитель',
  dimensionsMm: 'Габариты',
  weightKg: 'Вес',
  volumeM3: 'Объём',
  packageCount: 'Количество упаковок',
  warrantyMonths: 'Гарантия',
  maxLoadKg: 'Максимальная нагрузка',
  minimumDoorWidthCm: 'Мин. ширина двери для заноса',
  frameMaterialText: 'Материал каркаса',
  facadeMaterialText: 'Материал фасада',
  edgeMaterialText: 'Материал кромки',
  shelfMaterialText: 'Материал полок',
  drawerMaterialText: 'Материал ящиков',
  countertopMaterialText: 'Материал столешницы',
  upholsteryText: 'Обивка',
  hardwareText: 'Фурнитура',
  frontHardwareText: 'Фурнитура фасадов',
  kitchenShape: 'Форма кухни',
  kitchenElements: 'Элементы кухни',
  countertopDimensionsMm: 'Габариты столешницы',
  bedDimensionsMm: 'Габариты спального места',
  recommendedMattressHeightMm: 'Рекомендуемая высота матраса',
  mattressInsetMm: 'Углубление под матрас',
  mattressBase: 'Основание под матрас',
  includedItems: 'Комплектация',
  decor: 'Декор',
  packagingNotes: 'Упаковка',
  additionalInfo: 'Дополнительно',
};

type ProductFieldKey = keyof ProductCustomFields;

export const groups: { title: string; fields: ProductFieldKey[] }[] = [
  {
    title: 'Общие',
    fields: ['vendorName', 'dimensionsMm', 'weightKg', 'volumeM3', 'packageCount', 'warrantyMonths', 'maxLoadKg', 'minimumDoorWidthCm'],
  },
  {
    title: 'Материалы',
    fields: ['frameMaterialText', 'facadeMaterialText', 'edgeMaterialText', 'shelfMaterialText', 'drawerMaterialText', 'countertopMaterialText', 'upholsteryText'],
  },
  {
    title: 'Фурнитура',
    fields: ['hardwareText', 'frontHardwareText'],
  },
  {
    title: 'Кухня',
    fields: ['kitchenShape', 'kitchenElements', 'countertopDimensionsMm'],
  },
  {
    title: 'Кровать',
    fields: ['bedDimensionsMm', 'recommendedMattressHeightMm', 'mattressInsetMm', 'mattressBase'],
  },
  {
    title: 'Комплектация',
    fields: ['includedItems', 'decor', 'packagingNotes', 'additionalInfo'],
  },
];

type DimensionField = string | DimensionValue;

export function buildProductGroups(customFields: ProductCustomFields): CharacteristicGroup[] {
  return groups
    .map((group) => {
      const rows: CharacteristicRow[] = group.fields
        .filter((key) => customFields[key] != null && customFields[key] !== '')
        .map((key) => ({
          label: productLabels[key] ?? key,
          value: formatValue(key, customFields[key] as string | number | DimensionField),
        }));
      return { title: group.title, rows };
    })
    .filter((group) => group.rows.length > 0);
}

export function buildVariantGroup(customFields: ProductVariantCustomFields): CharacteristicGroup | null {
  const pairs: { label: string; labelKey: keyof ProductVariantCustomFields; descKey: keyof ProductVariantCustomFields }[] = [
    { label: 'Отделка', labelKey: 'finishLabel', descKey: 'finishDescription' },
    { label: 'Обивка', labelKey: 'upholsteryLabel', descKey: 'upholsteryDescription' },
    { label: 'Профиль', labelKey: 'profileLabel', descKey: 'profileDescription' },
  ];

  const rows: CharacteristicRow[] = pairs
    .filter((pair) => customFields[pair.labelKey] != null && customFields[pair.labelKey] !== '')
    .map((pair) => {
      const labelVal = customFields[pair.labelKey] as string;
      const descVal = customFields[pair.descKey] as string | null;

      return {
        label: pair.label,
        value: descVal ? `${labelVal} — ${descVal}` : labelVal,
      };
    });

  return rows.length > 0 ? { title: 'Отделка варианта', rows } : null;
}

export function buildAllCharacteristicGroups(productCustomFields: ProductCustomFields, variantCustomFields: ProductVariantCustomFields | null): CharacteristicGroup[] {
  const productGroups = buildProductGroups(productCustomFields);
  const variantGroup = variantCustomFields ? buildVariantGroup(variantCustomFields) : null;
  return variantGroup ? [...productGroups, variantGroup] : productGroups;
}

export function buildFlatCharacteristics(productCustomFields: ProductCustomFields, variantCustomFields: ProductVariantCustomFields | null): CharacteristicRow[] {
  return buildAllCharacteristicGroups(productCustomFields, variantCustomFields).flatMap((g) => g.rows);
}
