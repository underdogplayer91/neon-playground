import test from 'node:test';
import assert from 'node:assert/strict';
import { trackMetaEventOnce } from '../src/metaPixel.js';

const createStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
};

test('browser Meta events include a stable deduplication eventID', () => {
  const calls = [];
  global.window = {
    crypto: { randomUUID: () => 'session-1234-5678' },
    sessionStorage: createStorage(),
    fbq: (...args) => calls.push(args),
  };

  trackMetaEventOnce('initiate-checkout:YH-123', 'InitiateCheckout', { value: 150 });
  trackMetaEventOnce('initiate-checkout:YH-123', 'InitiateCheckout', { value: 150 });

  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'track');
  assert.equal(calls[0][1], 'InitiateCheckout');
  assert.match(calls[0][3].eventID, /^yh_InitiateCheckout_initiate-checkout-YH-123_/);
  assert.ok(calls[0][3].eventID.length <= 100);

  delete global.window;
});

test('custom Meta events send eventID as the fourth fbq argument', () => {
  const calls = [];
  global.window = {
    crypto: { randomUUID: () => 'session-custom-1234' },
    sessionStorage: createStorage(),
    fbq: (...args) => calls.push(args),
  };

  trackMetaEventOnce('customize-product', 'CustomizeProduct', { interaction_type: 'configurator' }, { custom: true });

  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'trackCustom');
  assert.equal(calls[0][1], 'CustomizeProduct');
  assert.match(calls[0][3].eventID, /^yh_CustomizeProduct_customize-product_/);

  delete global.window;
});
