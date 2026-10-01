const test = require('node:test');
const assert = require('node:assert/strict');
const { parsePrice, parsePromotionPrice } = require('./price');

test('parses Turkish prices with a decimal comma', () => {
  assert.equal(parsePrice('172,00₺'), 172);
  assert.equal(parsePrice('99,95₺'), 99.95);
  assert.equal(parsePrice('₺45'), 45);
  assert.equal(parsePrice('12,50'), 12.5);
});

test('keeps thousands separators (1.299,90 is not 1.299)', () => {
  assert.equal(parsePrice('1.299,90 ₺'), 1299.9);
  assert.equal(parsePrice('12.499,00₺'), 12499);
  assert.equal(parsePrice('1.299'), 1299);
  assert.equal(parsePrice('12,500'), 12500);
  assert.equal(parsePrice('1,299.50'), 1299.5);
});

test('parses a decimal dot', () => {
  assert.equal(parsePrice('109.00 TL'), 109);
  assert.equal(parsePrice('7.5'), 7.5);
});

test('returns NaN when there is no number', () => {
  assert.ok(Number.isNaN(parsePrice('')));
  assert.ok(Number.isNaN(parsePrice('TL')));
  assert.ok(Number.isNaN(parsePrice(undefined)));
});

test('extracts the price from ŞOK promotion badges', () => {
  assert.equal(parsePromotionPrice('50 TL üzeri 109.00 TL!'), 109);
  assert.equal(parsePromotionPrice('250 TL üzeri 1.099,00 TL!'), 1099);
  assert.equal(parsePromotionPrice('2 Al 1 Öde'), undefined);
  assert.equal(parsePromotionPrice(''), undefined);
});
