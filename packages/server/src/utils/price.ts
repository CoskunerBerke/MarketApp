/**
 * Parses a price as shown on Turkish supermarket sites ("172,00₺", "1.299,90 ₺",
 * "109.00 TL") into a number. Same rules as scripts/lib/price.js, which the
 * GitHub Actions scrapers use. Returns NaN when the text contains no number.
 */
export const parsePrice = (text: string | null | undefined): number => {
  const cleaned = String(text ?? '').replace(/[^\d.,]/g, '').replace(/^[.,]+|[.,]+$/g, '');
  if (!/\d/.test(cleaned)) return NaN;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  const lastSep = Math.max(lastComma, lastDot);
  if (lastSep === -1) return Number(cleaned);

  const digitsAfter = cleaned.length - lastSep - 1;
  const bothSeparators = lastComma > -1 && lastDot > -1;
  const isDecimal = bothSeparators || digitsAfter !== 3;

  const integerPart = cleaned.slice(0, lastSep).replace(/[.,]/g, '');
  const fraction = cleaned.slice(lastSep + 1);
  return isDecimal ? Number(`${integerPart}.${fraction}`) : Number(`${integerPart}${fraction}`);
};

/** "50 TL üzeri 109.00 TL!" -> 109; undefined when there is no threshold price. */
export const parsePromotionPrice = (promotionText: string | null | undefined): number | undefined => {
  if (!promotionText || !promotionText.includes('üzeri')) return undefined;
  const match = promotionText.split('üzeri')[1].match(/\d[\d.,]*/);
  if (!match) return undefined;
  const price = parsePrice(match[0]);
  return Number.isNaN(price) ? undefined : price;
};
