import { describe, expect, it } from 'vitest';
import { parsePrice, parsePromotionPrice } from '../src/utils/price';

describe('parsePrice', () => {
  it('parses Turkish prices with a decimal comma', () => {
    expect(parsePrice('172,00₺')).toBe(172);
    expect(parsePrice('99,95₺')).toBe(99.95);
  });

  it('keeps thousands separators', () => {
    // the previous parser turned "1.299,00₺" into 1.299
    expect(parsePrice('1.299,00₺')).toBe(1299);
    expect(parsePrice('12.499,90 ₺')).toBe(12499.9);
    expect(parsePrice('1.299')).toBe(1299);
  });

  it('parses a decimal dot and rejects text without numbers', () => {
    expect(parsePrice('109.00 TL')).toBe(109);
    expect(parsePrice('TL')).toBeNaN();
  });
});

describe('parsePromotionPrice', () => {
  it('reads the threshold price from ŞOK badges', () => {
    expect(parsePromotionPrice('50 TL üzeri 125.00 TL!')).toBe(125);
    expect(parsePromotionPrice('250 TL üzeri 1.099,00 TL!')).toBe(1099);
    expect(parsePromotionPrice('2 Al 1 Öde')).toBeUndefined();
  });
});
