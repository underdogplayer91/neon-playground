import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import {
  buildBillFields,
  resolvePayment,
  validateCheckout,
  verifyCallbackHash,
} from '../server/toyyibpay.js';
import { buildOrderRecord, mapToyyibPayStatus } from '../server/supabase.js';
import { validatePaidOrder } from '../server/paidOrder.js';

test('server charges the live estimate below RM200 and a RM100 deposit from RM200', () => {
  assert.deepEqual(resolvePayment({ text: 'ABCDEFGH', estimatedPrice: 150 }).amount, 150);
  assert.deepEqual(resolvePayment({ text: 'ABCDEFGHI', estimatedPrice: 199.99 }).amount, 199.99);
  assert.deepEqual(resolvePayment({ text: 'ABCDEFGHI', estimatedPrice: 200 }).amount, 100);
  assert.deepEqual(resolvePayment({ text: 'ABCDEFGHIJKLMNOP', estimatedPrice: 845.27 }).amount, 100);
  assert.deepEqual(resolvePayment({ tier: 'custom', text: '' }).amount, 100);
});

test('spaces and line breaks do not change the package tier', () => {
  const payment = resolvePayment({ text: 'KOPI\nJIWA', estimatedPrice: 175 });
  assert.equal(payment.characterCount, 8);
  assert.equal(payment.tier, 'basic');
});

test('bill amount is fixed in cents and secret remains server-side', () => {
  const result = buildBillFields({
    order: { reference: 'YH-TEST123', tier: 'basic', text: 'KOPI JIWA', estimatedPrice: 175.55, fontName: 'Amanda', colorLabel: 'Pink' },
    customer: { name: 'Ali Ahmad', phone: '0123456789', email: 'ali@example.com', address1: 'Jalan Satu', postcode: '43000', city: 'Kajang', state: 'Selangor' },
    siteUrl: 'https://www.pakarneonled.store',
    secretKey: 'test-secret',
    categoryCode: 'w4npro7z',
  });
  assert.equal(result.fields.billPriceSetting, '1');
  assert.equal(result.fields.billAmount, '17555');
  assert.equal(result.fields.billName, 'Tempahan Pakar Neon LED');
  assert.equal(result.fields.userSecretKey, 'test-secret');
  assert.equal(result.fields.billReturnUrl, 'https://www.pakarneonled.store/payment-status');
  assert.equal(result.fields.billCallbackUrl, 'https://www.pakarneonled.store/api/payment-callback');
});

test('checkout requires a valid customer email', () => {
  const order = { reference: 'YH-TEST123', tier: 'basic', text: 'KOPI', estimatedPrice: 150 };
  const customer = { name: 'Ali Ahmad', phone: '0123456789', email: 'ali@example.com', address1: 'Jalan Satu', postcode: '43000', city: 'Kajang', state: 'Selangor' };

  assert.throws(() => validateCheckout(order, { ...customer, email: '' }), /Alamat email diperlukan/);
  assert.throws(() => validateCheckout(order, { ...customer, email: 'ali@invalid' }), /Alamat email tidak sah/);
  assert.equal(validateCheckout(order, customer).customer.email, 'ali@example.com');
});

test('callback hash must match ToyyibPay verification formula', () => {
  const secret = 'server-only-secret';
  const payload = { status: '1', order_id: 'YH_TEST', refno: 'TP123' };
  payload.hash = createHash('md5').update(`${secret}1YH_TESTTP123ok`).digest('hex');
  assert.equal(verifyCallbackHash(payload, secret), true);
  assert.equal(verifyCallbackHash({ ...payload, status: '3' }, secret), false);
});

test('validated checkout becomes a complete Supabase order record with its Cloudinary design reference', () => {
  const record = buildOrderRecord({
    order: { fontName: 'Amanda', colorLabel: 'Pink', wordColors: [], previewUrl: 'https://res.cloudinary.com/demo/design.jpg', previewPublicId: 'pakar-neon/orders/YH_TEST_123', sizeNote: '64 × 48 cm', backboardSizeNote: '70 × 54 cm', designLayers: [{ word: 'KOPI', font: 'Amanda', colour: 'Pink', widthCm: 32.4, heightCm: 15, rotationDeg: -5 }] },
    customer: { name: 'Ali Ahmad', phone: '0123456789', email: '', address1: 'Jalan Satu', address2: '', postcode: '43000', city: 'Kajang', state: 'Selangor' },
    payment: { tier: 'basic', packageName: 'Pakej 8 Huruf', amount: 150, text: 'KOPI', characterCount: 4 },
    reference: 'YH_TEST_123',
  });
  assert.equal(record.reference, 'YH_TEST_123');
  assert.equal(record.neon_text, 'KOPI');
  assert.equal(record.customer_phone, '0123456789');
  assert.equal(record.amount, 150);
  assert.equal(record.payment_status, 'creating_bill');
  assert.equal(record.order_snapshot.previewUrl, 'https://res.cloudinary.com/demo/design.jpg');
  assert.equal(record.order_snapshot.backboardSizeNote, '70 × 54 cm');
  assert.deepEqual(record.order_snapshot.designLayers[0], { word: 'KOPI', font: 'Amanda', colour: 'Pink', widthCm: 32.4, heightCm: 15, rotationDeg: -5 });
});

test('legacy voucher input cannot apply a discount or extended warranty', () => {
  const record = buildOrderRecord({
    order: { fontName: 'Amanda', colorLabel: 'Pink', wordColors: [], estimatedPrice: 500 },
    customer: { name: 'Ali Ahmad', phone: '0123456789', email: '', address1: 'Jalan Satu', address2: '', postcode: '43000', city: 'Kajang', state: 'Selangor' },
    payment: { tier: 'basic', packageName: 'Pakej 8 Huruf', amount: 150, text: 'KOPI', characterCount: 4 },
    reference: 'YH_DISCOUNT',
    shippingVoucher: { id: 'voucher-123', active: true, discountPercent: 10 },
  });
  assert.equal(record.amount, 150);
  assert.equal(record.order_snapshot.shippingVoucherClaimId, null);
  assert.equal(record.order_snapshot.fullPrice, 500);
  assert.equal(record.order_snapshot.discountPercent, 0);
  assert.equal(record.order_snapshot.discountedFullPrice, 500);
  assert.equal(record.order_snapshot.warrantyMonthsOriginal, 3);
  assert.equal(record.order_snapshot.warrantyMonths, 3);
});

test('ToyyibPay callback statuses map to stored payment states', () => {
  assert.equal(mapToyyibPayStatus('1'), 'paid');
  assert.equal(mapToyyibPayStatus('3'), 'failed');
  assert.equal(mapToyyibPayStatus('2'), 'pending');
});

test('paid fulfillment only accepts the bill and amount stored on the order', () => {
  const order = { reference: 'YH_TEST_123', bill_code: 'abc123', amount: 150 };
  assert.doesNotThrow(() => validatePaidOrder(order, { billCode: 'abc123', amount: '150.00' }));
  assert.throws(() => validatePaidOrder(order, { billCode: 'different', amount: '150.00' }), /Bill Code/);
  assert.throws(() => validatePaidOrder(order, { billCode: 'abc123', amount: '100.00' }), /Jumlah pembayaran/);
});
