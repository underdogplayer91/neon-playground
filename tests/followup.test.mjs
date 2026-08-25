import assert from 'node:assert/strict';
import test from 'node:test';
import { groupPendingFollowUps } from '../server/followup.js';

test('multiple pending attempts from the same phone become one follow-up using the latest order', () => {
  const groups = groupPendingFollowUps([
    { reference: 'YH_LATEST', customer_phone: '01169530763', customer_email: 'latest@example.com' },
    { reference: 'YH_OLDER', customer_phone: '+601169530763', customer_email: 'older@example.com' },
    { reference: 'YH_OTHER', customer_phone: '0123456789', customer_email: 'other@example.com' },
  ]);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].order.reference, 'YH_LATEST');
  assert.deepEqual(groups[0].references, ['YH_LATEST', 'YH_OLDER']);
  assert.equal(groups[1].order.reference, 'YH_OTHER');
});

test('email is used to consolidate attempts when a phone number is unavailable', () => {
  const groups = groupPendingFollowUps([
    { reference: 'YH_ONE', customer_phone: '', customer_email: 'ALI@example.com' },
    { reference: 'YH_TWO', customer_phone: '', customer_email: 'ali@example.com' },
  ]);
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].references, ['YH_ONE', 'YH_TWO']);
});
