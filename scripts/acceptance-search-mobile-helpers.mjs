export const CURRENT_SEARCH_INPUT_PLACEHOLDER = 'Кровать, диван, кухня…';
export const CURRENT_SEARCH_INPUT_SELECTOR = `input[placeholder="${CURRENT_SEARCH_INPUT_PLACEHOLDER}"]`;

/** Collapse image/title links from one card, preserving product order. */
export function distinctProductSlugs(hrefs, baseUrl = 'https://test.example/') {
  const seen = new Set();
  const slugs = [];
  for (const href of hrefs) {
    let slug;
    try {
      const url = new URL(href, baseUrl);
      slug = url.pathname.split('/').filter(Boolean).at(-1);
    } catch {
      continue;
    }
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    slugs.push(slug);
  }
  return slugs;
}

/** Browser-independent visibility contract for the mobile search control. */
export function isVisibleSearchControl({ exists, display, visibility, opacity, width, height }) {
  return Boolean(exists && display !== 'none' && visibility !== 'hidden' && visibility !== 'collapse' && opacity !== '0' && Number(width) > 0 && Number(height) > 0);
}
