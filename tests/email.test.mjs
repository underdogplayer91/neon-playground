import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCustomerOrderEmail, buildCustomerPendingEmail, buildOwnerOrderEmail } from '../server/email.js';

const order = {
  reference: 'YH_TEST_123',
  customer_name: 'Ali <script>alert(1)</script>',
  customer_phone: '0123456789',
  customer_email: 'ali@example.com',
  address_line_1: 'Jalan Satu',
  address_line_2: '',
  postcode: '43000',
  city: 'Kajang',
  state: 'Selangor',
  neon_text: 'kopi\njiwa',
  font_name: 'Amanda',
  color_label: 'Pink',
  word_colors: [{ text: 'kopi', label: 'Pink' }, { text: 'jiwa', label: 'Yellow' }],
  package_tier: 'basic',
  package_name: 'Pakej 8 Huruf',
  amount: 150,
  estimated_price: null,
};

test('owner notification contains the complete order without unsafe customer HTML', () => {
  const email = buildOwnerOrderEmail(order);
  assert.match(email.subject, /YH_TEST_123/);
  assert.match(email.html, /0123456789/);
  assert.match(email.html, /Jalan Satu/);
  assert.match(email.html, /kopi — Pink, jiwa — Yellow/);
  assert.doesNotMatch(email.html, /<script>alert/);
  assert.match(email.html, /Ali &lt;script&gt;alert/);
});

test('customer confirmation explains payment and the WhatsApp design confirmation', () => {
  const email = buildCustomerOrderEmail(order);
  assert.match(email.subject, /YH_TEST_123/);
  assert.match(email.html, /RM150\.00/);
  assert.match(email.html, /WhatsApp/);
  assert.match(email.html, /https:\/\/www\.wasap\.my\/601169530763/);
  assert.match(email.html, /WhatsApp Team pakarneonled\.store/);
  assert.match(email.html, /kopi<br>jiwa/);
});

test('pending customer email clearly says payment is incomplete and links back to ToyyibPay', () => {
  const email = buildCustomerPendingEmail({
    ...order,
    payment_url: 'https://toyyibpay.com/testBill123',
  });
  assert.match(email.subject, /Bayaran belum selesai/);
  assert.match(email.html, /bayaran masih belum selesai/i);
  assert.match(email.html, /https:\/\/toyyibpay\.com\/testBill123/);
  assert.match(email.html, /Sambung Pembayaran/);
  assert.match(email.html, /WhatsApp Team pakarneonled\.store/);
  assert.doesNotMatch(email.html, /Pembayaran ToyyibPay telah disahkan/);
});
