import test from 'node:test';
import assert from 'node:assert/strict';
import { getCheckoutColourSummary, getCheckoutSizeSummary } from '../src/orderSummary.js';

test('Classic checkout shows package width limits without replacing measured/custom sizing', () => {
  for (const count of [1, 8]) assert.equal(getCheckoutSizeSummary({ pricingModel: 'classic-package', text: 'A'.repeat(count) }), '≤ 60cm');
  for (const count of [9, 15]) assert.equal(getCheckoutSizeSummary({ pricingModel: 'classic-package', text: 'A'.repeat(count) }), '≤ 85cm');
  assert.equal(getCheckoutSizeSummary({ pricingModel: 'classic-package', text: 'ABCD EFGH\nIJKLMNO' }), '≤ 85cm');
  assert.equal(getCheckoutSizeSummary({ pricingModel: 'classic-package', text: 'A'.repeat(16), sizeNote: 'Custom size' }), 'Custom size');
  assert.equal(getCheckoutSizeSummary({ text: 'ABCDEFGHI', sizeNote: '70 × 20 cm' }), '70 × 20 cm');
});

test('checkout colour summary follows the actual colours stored on preview layers', () => {
  const order = {
    colorLabel: 'Pink',
    colorMode: 'multi',
    wordColors: [{ label: 'Pink' }, { label: 'Yellow' }],
    designSnapshot: {
      layers: [
        { text: 'Kopi', colorLabel: 'Purple' },
        { text: 'Jiwa', colorLabel: 'Ice Blue' },
        { text: 'Cafe', colorLabel: 'Purple' },
      ],
    },
  };

  assert.equal(getCheckoutColourSummary(order), 'Purple, Ice Blue');
});

test('checkout colour summary keeps legacy word colours when no layer snapshot exists', () => {
  const order = {
    colorLabel: 'Pink',
    colorMode: 'multi',
    wordColors: [{ label: 'Pink' }, { label: 'Yellow' }, { label: 'Pink' }],
  };

  assert.equal(getCheckoutColourSummary(order), 'Pink, Yellow');
});

test('checkout colour summary falls back to the single saved colour', () => {
  assert.equal(getCheckoutColourSummary({ colorLabel: 'Red', colorMode: 'single' }), 'Red');
});
