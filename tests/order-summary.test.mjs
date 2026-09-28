import test from 'node:test';
import assert from 'node:assert/strict';
import { getCheckoutColourSummary } from '../src/orderSummary.js';

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
