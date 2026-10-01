/**
 * Parses a price as shown on Turkish supermarket sites into a number.
 *
 *   "172,00₺"   -> 172       (comma = decimal separator)
 *   "1.299,90 ₺" -> 1299.9   (dot = thousands separator)
 *   "109.00 TL" -> 109       (dot followed by two digits = decimal)
 *   "1.299"     -> 1299      (dot followed by three digits = thousands)
 *   "12,500"    -> 12500     (same for a comma: the sites print two decimals, not three)
 *
 * Returns NaN when the text contains no number.
 */
function parsePrice(text) {
  const cleaned = String(text ?? '').replace(/[^\d.,]/g, '').replace(/^[.,]+|[.,]+$/g, '');
  if (!/\d/.test(cleaned)) return NaN;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  const lastSep = Math.max(lastComma, lastDot);
  if (lastSep === -1) return Number(cleaned);

  const digitsAfter = cleaned.length - lastSep - 1;
  const bothSeparators = lastComma > -1 && lastDot > -1;
  // With both separators the last one is the decimal separator. With a single kind,
  // exactly three trailing digits means it was a thousands separator ("1.299").
  const isDecimal = bothSeparators || digitsAfter !== 3;

  const integerPart = cleaned.slice(0, lastSep).replace(/[.,]/g, '');
  const fraction = cleaned.slice(lastSep + 1);
  return isDecimal ? Number(`${integerPart}.${fraction}`) : Number(`${integerPart}${fraction}`);
}

/**
 * Extracts the threshold price from ŞOK promotion badges such as
 * "50 TL üzeri 109.00 TL!" (-> 109). Returns undefined when there is none.
 */
function parsePromotionPrice(promotionText) {
  if (!promotionText || !promotionText.includes('üzeri')) return undefined;
  const match = promotionText.split('üzeri')[1].match(/\d[\d.,]*/);
  if (!match) return undefined;
  const price = parsePrice(match[0]);
  return Number.isNaN(price) ? undefined : price;
}

module.exports = { parsePrice, parsePromotionPrice };
