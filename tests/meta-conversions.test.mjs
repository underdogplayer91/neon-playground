import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { buildMetaPurchaseEvent, normalisePhone } from '../server/metaConversions.js';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

test('Meta Purchase uses trusted payment value and deterministic event ID', () => {
  const event = buildMetaPurchaseEvent({
    reference: 'YH_TEST_123',
    amount: 150,
    package_tier: 'basic',
    package_name: 'Pakej 8 Huruf',
    customer_name: 'Ali Ahmad',
    customer_email: 'ALI@EXAMPLE.COM',
    customer_phone: '012-345 6789',
    city: 'Kuala Lumpur',
    state: 'W.P. Kuala Lumpur',
    postcode: '50000',
    order_snapshot: {
      tracking: {
        fbp: 'fb.1.123.456',
        fbc: 'fb.1.123.click',
        clientIpAddress: '203.0.113.10',
        clientUserAgent: 'Example Browser',
      },
    },
  }, 1_700_000_000);

  assert.equal(event.event_name, 'Purchase');
  assert.equal(event.event_id, 'purchase_YH_TEST_123');
  assert.equal(event.event_time, 1_700_000_000);
  assert.equal(event.custom_data.currency, 'MYR');
  assert.equal(event.custom_data.value, 150);
  assert.deepEqual(event.user_data.em, [sha256('ali@example.com')]);
  assert.deepEqual(event.user_data.ph, [sha256('60123456789')]);
  assert.equal(event.user_data.client_ip_address, '203.0.113.10');
  assert.equal(event.user_data.client_user_agent, 'Example Browser');
  assert.equal(event.user_data.fbp, 'fb.1.123.456');
  assert.equal(event.user_data.fbc, 'fb.1.123.click');
  assert.equal(JSON.stringify(event).includes('ALI@EXAMPLE.COM'), false);
  assert.equal(JSON.stringify(event).includes('012-345 6789'), false);
});

test('Malaysian phone normalisation keeps country code consistent', () => {
  assert.equal(normalisePhone('011-6953 0763'), '601169530763');
  assert.equal(normalisePhone('+60 11-6953 0763'), '601169530763');
});
