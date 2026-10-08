import { Box, Link, Typography } from '@mui/material';
import { createElement, type ElementType } from 'react';

type SourceKind = 'VENDOR' | 'CATALOG' | null;

interface DescriptionCharacteristic {
  name: string;
  value: string;
}

export interface DescriptionEvidenceProps {
  productName: string | null;
  sourceUrl: string | null;
  sourceKind: SourceKind;
  parsedCharacteristics: DescriptionCharacteristic[];
}

const BoxElement = Box as ElementType;
const TypographyElement = Typography as ElementType;

function isSafeSourceUrl(sourceUrl: string | null): sourceUrl is string {
  if (!sourceUrl || [...sourceUrl].some((character) => character.charCodeAt(0) <= 31 || character.charCodeAt(0) === 127)) return false;
  try {
    const parsed = new URL(sourceUrl);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.username === '' && parsed.password === '';
  } catch {
    return false;
  }
}

export function DescriptionEvidence(props: DescriptionEvidenceProps) {
  const sourceLabel = props.sourceKind === 'CATALOG' ? 'Исходная карточка DomFabrik' : 'Исходная информация';
  const sourceLink =
    props.sourceKind && isSafeSourceUrl(props.sourceUrl)
      ? createElement(Link, { href: props.sourceUrl, referrerPolicy: 'no-referrer', rel: 'noopener noreferrer', target: '_blank' }, sourceLabel)
      : null;
  const characteristicContent =
    props.parsedCharacteristics.length > 0
      ? createElement(
          BoxElement,
          { component: 'dl', sx: { display: 'grid', gap: 1, m: 0 } },
          ...props.parsedCharacteristics.map((characteristic) =>
            createElement(
              BoxElement,
              {
                component: 'div',
                key: `${characteristic.name}\u0000${characteristic.value}`,
                sx: { display: 'grid', gap: 0.5, gridTemplateColumns: { sm: 'minmax(12rem, 0.35fr) 1fr', xs: '1fr' } },
              },
              createElement(TypographyElement, { component: 'dt', sx: { fontWeight: 600 } }, characteristic.name),
              createElement(TypographyElement, { component: 'dd', sx: { m: 0 } }, characteristic.value),
            ),
          ),
        )
      : createElement(TypographyElement, { color: 'text.secondary', component: 'p', sx: { m: 0 } }, 'Подтверждённые характеристики не найдены');

  return createElement(
    BoxElement,
    { sx: { display: 'flex', flexDirection: 'column', gap: 2 } },
    (props.productName || sourceLink) &&
      createElement(
        BoxElement,
        { sx: { alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center' } },
        props.productName && createElement(TypographyElement, { component: 'h2', sx: { fontSize: '1.25rem', fontWeight: 700, textAlign: 'center' } }, props.productName),
        sourceLink,
      ),
    createElement(
      BoxElement,
      { 'aria-labelledby': 'description-review-evidence-heading', component: 'section', sx: { border: '1px solid', borderColor: 'divider', borderRadius: 2, p: { sm: 3, xs: 2 } } },
      createElement(
        TypographyElement,
        { component: 'h2', id: 'description-review-evidence-heading', sx: { fontSize: '1.125rem', fontWeight: 700, mb: 2 } },
        'Удалось выделить характеристики',
      ),
      characteristicContent,
    ),
  );
}
