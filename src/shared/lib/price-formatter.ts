/**
 * @param price - price to format (in minor units, e.g. kopecks)
 */
export function priceFormatter(price: number) {
  const formatter = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currencyDisplay: 'symbol',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(price / 100);
}
