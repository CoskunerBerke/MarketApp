/**
 * Parses a price as shown on Turkish supermarket sites ("172,00₺", "1.299,90 ₺",
 * "109.00 TL") into a number. Same rules as scripts/lib/price.js, which the
 * GitHub Actions scrapers use. Returns NaN when the text contains no number.
 *
 * A single kind of separator followed by exactly three digits is read as a
 * thousands separator ("1.299" -> 1299, "12,500" -> 12500): the sites print
 * prices with two decimals ("12,50₺", "109.00 TL"), not three.
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

/**
 * BİM shows the whole part and the decimals of a price in separate elements
 * (".text.quantify" = "1.099," and ".kusurArea .number" = "00"); struck-through
 * old prices come as one text ("189,00") or without decimals ("1.299").
 * Returns NaN when there is no number. Same logic as scripts/scrape-bim.js.
 */
export const parseBimPrice = (wholeText: string, decimalText: string): number => {
  if (decimalText) {
    return parseFloat(`${wholeText.replace(/[^\d]/g, '')}.${decimalText.replace(/[^\d]/g, '')}`);
  }
  return parsePrice(wholeText);
};

/** "50 TL üzeri 109.00 TL!" -> 109; undefined when there is no threshold price. */
export const parsePromotionPrice = (promotionText: string | null | undefined): number | undefined => {
  if (!promotionText || !promotionText.includes('üzeri')) return undefined;
  const match = promotionText.split('üzeri')[1].match(/\d[\d.,]*/);
  if (!match) return undefined;
  const price = parsePrice(match[0]);
  return Number.isNaN(price) ? undefined : price;
};
