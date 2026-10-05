export type { CharacteristicGroup, CharacteristicRow } from './characteristics';
export {
  buildAllCharacteristicGroups,
  buildFlatCharacteristics,
  buildProductGroups,
  buildVariantGroup,
  formatDimensionValue,
  formatValue,
  productLabels,
} from './characteristics';
export { generateProductMetadata } from './generate-meta';
export { buildBreadcrumbJsonLd, buildProductJsonLd } from './product-jsonld';
