/**
 * @param price - price to format (in minor units, e.g. kopecks)
 */
export function priceFormatter(price: number, currency: 'RUB' = 'RUB') {
  const formatter = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currencyDisplay: 'symbol',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return formatter.format(price / 100);
}
