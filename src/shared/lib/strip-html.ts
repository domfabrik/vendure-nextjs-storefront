const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: '\u00a0',
  quot: '"',
};

function decodeHtmlEntity(entity: string): string {
  if (entity.startsWith('#x') || entity.startsWith('#X')) {
    const codePoint = Number.parseInt(entity.slice(2), 16);
    return Number.isInteger(codePoint) && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : `&${entity};`;
  }
  if (entity.startsWith('#')) {
    const codePoint = Number.parseInt(entity.slice(1), 10);
    return Number.isInteger(codePoint) && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : `&${entity};`;
  }
  return NAMED_ENTITIES[entity.toLowerCase()] ?? `&${entity};`;
}

// утилита для очистки HTML-тегов из описаний
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&(#(?:x[0-9a-f]+|[0-9]+)|[a-z]+);/gi, (_match, entity: string) => decodeHtmlEntity(entity))
    .replace(/\s+/g, ' ')
    .trim();
}
