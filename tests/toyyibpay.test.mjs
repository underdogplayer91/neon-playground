import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import {
  buildBillFields,
  resolvePayment,
  verifyCallbackHash,
} from '../server/toyyibpay.js';
import { buildOrderRecord, mapToyyibPayStatus } from '../server/supabase.js';

test('server derives trusted package amounts from neon text', () => {
  assert.deepEqual(resolvePayment({ tier: 'custom', text: 'ABCDEFGH' }).amount, 150);
  assert.deepEqual(resolvePayment({ tier: 'basic', text: 'ABCDEFGHI' }).amount, 200);
  assert.deepEqual(resolvePayment({ tier: 'plus', text: 'ABCDEFGHIJKLMNOP' }).amount, 100);
  assert.deepEqual(resolvePayment({ tier: 'custom', text: '' }).amount, 100);
});

test('spaces and line breaks do not change the package tier', () => {
  const payment = resolvePayment({ text: 'KOPI\nJIWA' });
  assert.equal(payment.characterCount, 8);
  assert.equal(payment.tier, 'basic');
});

test('bill amount is fixed in cents and secret remains server-side', () => {
  const result = buildBillFields({
    order: { reference: 'YH-TEST123', tier: 'basic', text: 'KOPI JIWA', fontName: 'Amanda', colorLabel: 'Pink' },
    customer: { name: 'Ali Ahmad', phone: '0123456789', email: 'ali@example.com', address1: 'Jalan Satu', postcode: '43000', city: 'Kajang', state: 'Selangor' },
    siteUrl: 'https://www.pakarneonled.store',
    secretKey: 'test-secret',
    categoryCode: 'w4npro7z',
  });
  assert.equal(result.fields.billPriceSetting, '1');
  assert.equal(result.fields.billAmount, '15000');
  assert.equal(result.fields.userSecretKey, 'test-secret');
  assert.equal(result.fields.billReturnUrl, 'https://www.pakarneonled.store/payment-status');
  assert.equal(result.fields.billCallbackUrl, 'https://www.pakarneonled.store/api/payment-callback');
});

test('callback hash must match ToyyibPay verification formula', () => {
  const secret = 'server-only-secret';
  const payload = { status: '1', order_id: 'YH_TEST', refno: 'TP123' };
  payload.hash = createHash('md5').update(`${secret}1YH_TESTTP123ok`).digest('hex');
  assert.equal(verifyCallbackHash(payload, secret), true);
  assert.equal(verifyCallbackHash({ ...payload, status: '3' }, secret), false);
});

test('validated checkout becomes a complete Supabase order record', () => {
  const record = buildOrderRecord({
    order: { fontName: 'Amanda', colorLabel: 'Pink', wordColors: [] },
    customer: { name: 'Ali Ahmad', phone: '0123456789', email: '', address1: 'Jalan Satu', address2: '', postcode: '43000', city: 'Kajang', state: 'Selangor' },
    payment: { tier: 'basic', packageName: 'Pakej 8 Huruf', amount: 150, text: 'KOPI', characterCount: 4 },
    reference: 'YH_TEST_123',
  });
  assert.equal(record.reference, 'YH_TEST_123');
  assert.equal(record.neon_text, 'KOPI');
  assert.equal(record.customer_phone, '0123456789');
  assert.equal(record.amount, 150);
  assert.equal(record.payment_status, 'creating_bill');
});

test('ToyyibPay callback statuses map to stored payment states', () => {
  assert.equal(mapToyyibPayStatus('1'), 'paid');
  assert.equal(mapToyyibPayStatus('3'), 'failed');
  assert.equal(mapToyyibPayStatus('2'), 'pending');
});
