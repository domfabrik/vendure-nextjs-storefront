'use client';

import { Box, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import type { ProductCustomFields, ProductVariantCustomFields } from '@/shared/api';

interface ProductCharacteristicsProps {
  productCustomFields: ProductCustomFields;
  variantCustomFields: ProductVariantCustomFields | null;
}

interface CharacteristicRow {
  label: string;
  value: string;
}

interface CharacteristicGroup {
  title: string;
  rows: CharacteristicRow[];
}

function formatValue(key: string, value: string | number): string {
  const suffixes: Record<string, string> = {
    weightKg: ' кг',
    volumeM3: ' м³',
    warrantyMonths: ' мес.',
    maxLoadKg: ' кг',
    minimumDoorWidthCm: ' см',
    dimensionsMm: ' мм',
    countertopDimensionsMm: ' мм',
    bedDimensionsMm: ' мм',
    recommendedMattressHeightMm: ' мм',
    mattressInsetMm: ' мм',
  };

  const suffix = suffixes[key] ?? '';
  return `${value}${suffix}`;
}

const productLabels: Record<string, string> = {
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

const groups: { title: string; fields: ProductFieldKey[] }[] = [
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

function buildProductGroups(customFields: ProductCustomFields): CharacteristicGroup[] {
  return groups
    .map((group) => {
      const rows: CharacteristicRow[] = group.fields
        .filter((key) => customFields[key] != null && customFields[key] !== '')
        .map((key) => ({
          label: productLabels[key] ?? key,
          value: formatValue(key, customFields[key] as string | number),
        }));
      return { title: group.title, rows };
    })
    .filter((g) => g.rows.length > 0);
}

function buildVariantGroup(customFields: ProductVariantCustomFields): CharacteristicGroup | null {
  const pairs: { label: string; desc: string; labelKey: keyof ProductVariantCustomFields; descKey: keyof ProductVariantCustomFields }[] = [
    { label: 'Отделка', desc: '', labelKey: 'finishLabel', descKey: 'finishDescription' },
    { label: 'Обивка', desc: '', labelKey: 'upholsteryLabel', descKey: 'upholsteryDescription' },
    { label: 'Профиль', desc: '', labelKey: 'profileLabel', descKey: 'profileDescription' },
  ];

  const rows: CharacteristicRow[] = pairs
    .filter((p) => customFields[p.labelKey] != null && customFields[p.labelKey] !== '')
    .map((p) => {
      const labelVal = customFields[p.labelKey] as string;
      const descVal = customFields[p.descKey] as string | null;
      return {
        label: p.label,
        value: descVal ? `${labelVal} — ${descVal}` : labelVal,
      };
    });

  return rows.length > 0 ? { title: 'Отделка варианта', rows } : null;
}

export function ProductCharacteristics({ productCustomFields, variantCustomFields }: ProductCharacteristicsProps) {
  const productGroups = buildProductGroups(productCustomFields);
  const variantGroup = variantCustomFields ? buildVariantGroup(variantCustomFields) : null;

  const allGroups = variantGroup ? [...productGroups, variantGroup] : productGroups;

  if (allGroups.length === 0) return null;

  let rowIndex = 0;

  return (
    <Box sx={{ mt: 4 }}>
      <Typography
        variant="h6"
        sx={{ fontWeight: 600, mb: 2 }}
      >
        Характеристики
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableBody>
            {allGroups.map((group) => (
              <GroupRows
                key={group.title}
                group={group}
                showTitle={allGroups.length > 1}
                startIndex={(() => {
                  const idx = rowIndex;
                  rowIndex += group.rows.length;
                  return idx;
                })()}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function GroupRows({ group, showTitle, startIndex }: { group: CharacteristicGroup; showTitle: boolean; startIndex: number }) {
  return (
    <>
      {showTitle && (
        <TableRow>
          <TableCell
            colSpan={2}
            sx={{ fontWeight: 600, pt: 2, pb: 1, borderBottom: 'none', px: 1 }}
          >
            {group.title}
          </TableCell>
        </TableRow>
      )}
      {group.rows.map((row, i) => (
        <TableRow
          key={row.label}
          sx={{ bgcolor: (startIndex + i) % 2 === 0 ? 'action.hover' : 'transparent' }}
        >
          <TableCell sx={{ color: 'text.secondary', width: '40%', py: 1, px: 1, borderBottom: 'none' }}>{row.label}</TableCell>
          <TableCell sx={{ py: 1, px: 1, borderBottom: 'none' }}>{row.value}</TableCell>
        </TableRow>
      ))}
    </>
  );
}
