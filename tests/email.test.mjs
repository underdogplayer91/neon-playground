import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCustomerOrderEmail, buildCustomerPendingEmail, buildCustomLogoLeadEmail, buildOwnerOrderEmail, buildOwnerPendingEmail } from '../server/email.js';

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
  order_snapshot: {
    previewUrl: 'https://res.cloudinary.com/demo/image/upload/orders/YH_TEST_123.jpg',
    sizeNote: '64 × 48 cm',
    backboardSizeNote: '70 × 54 cm',
    designLayers: [{ word: 'kopi', font: 'Amanda', colour: 'Pink', widthCm: 32, heightCm: 15, rotationDeg: -5 }],
  },
};

test('claimed six-month warranty appears in owner/customer pending and paid emails only when claimed', () => {
  const claimed = { ...order, order_snapshot: { ...order.order_snapshot, warrantyMonths: 6, warrantyVoucher: { id: 'warranty-six-month-v1', claimed: true, months: 6 } } };
  for (const buildEmail of [buildOwnerOrderEmail, buildOwnerPendingEmail, buildCustomerOrderEmail, buildCustomerPendingEmail]) {
    assert.match(buildEmail(claimed).html, /Voucher warranty/);
    assert.match(buildEmail(claimed).html, /Jumlah warranty 6 bulan/);
    assert.doesNotMatch(buildEmail(order).html, /Voucher warranty/);
  }
});

test('owner notification contains the complete order without unsafe customer HTML', () => {
  const email = buildOwnerOrderEmail(order);
  assert.match(email.subject, /YH_TEST_123/);
  assert.match(email.html, /0123456789/);
  assert.match(email.html, /Jalan Satu/);
  assert.match(email.html, /<td[^>]*>Amanda<\/td>/);
  assert.match(email.html, /<td[^>]*>Pink<\/td>/);
  assert.doesNotMatch(email.html, /<script>alert/);
  assert.match(email.html, /Ali &lt;script&gt;alert/);
  assert.match(email.html, /WhatsApp Customer — Sahkan Rekaan/);
  assert.match(email.html, /wa\.me\/60123456789/);
  assert.match(email.html, /www\.pakarneonled\.store/);
  assert.match(email.html, /res\.cloudinary\.com\/demo\/image\/upload\/orders/);
  assert.match(email.html, /Detail setiap perkataan/);
  assert.match(email.html, /32 × 15 cm/);
  assert.match(email.html, /Saiz keseluruhan board/);
  assert.match(email.html, /70 × 54 cm/);
  assert.doesNotMatch(email.html, /<td[^>]*>Font<\/td>/);
  assert.doesNotMatch(email.html, /<td[^>]*>Warna<\/td>/);
});

test('owner pending notification includes a prefilled WhatsApp follow-up', () => {
  const email = buildOwnerPendingEmail({ ...order, created_at: '2026-08-25T10:00:00.000Z' });
  assert.match(email.subject, /Tempahan menunggu bayaran/);
  assert.match(email.html, /pembayaran masih belum diselesaikan/i);
  assert.match(email.html, /WhatsApp Customer — Bantu Selesaikan Bayaran/);
  assert.match(email.html, /wa\.me\/60123456789/);
  assert.match(email.html, /Website%20rasmi%3A/);
  assert.match(email.html, /https%3A%2F%2Fwww\.pakarneonled\.store/);
  assert.match(email.html, /Preview design neon pelanggan/);
  assert.doesNotMatch(email.html, /<td[^>]*>Font<\/td>/);
  assert.doesNotMatch(email.html, /<td[^>]*>Warna<\/td>/);
});

test('customer confirmation explains payment and the WhatsApp design confirmation', () => {
  const email = buildCustomerOrderEmail(order);
  assert.match(email.subject, /YH_TEST_123/);
  assert.match(email.html, /RM150/);
  assert.match(email.html, /WhatsApp/);
  assert.match(email.html, /https:\/\/www\.wasap\.my\/601169530763/);
  assert.match(email.html, /WhatsApp Team pakarneonled\.store/);
  assert.match(email.html, /kopi<br>jiwa/);
  assert.match(email.html, /Preview design neon pelanggan/);
  assert.doesNotMatch(email.html, /<td[^>]*>Font<\/td>/);
  assert.doesNotMatch(email.html, /<td[^>]*>Warna<\/td>/);
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
  assert.match(email.html, /Preview design neon pelanggan/);
  assert.doesNotMatch(email.html, /<td[^>]*>Font<\/td>/);
  assert.doesNotMatch(email.html, /<td[^>]*>Warna<\/td>/);
});

test('custom orders without preview layers keep their font and colour fallback rows', () => {
  const email = buildOwnerPendingEmail({ ...order, order_snapshot: {}, created_at: '2026-08-25T10:00:00.000Z' });
  assert.match(email.html, /<td[^>]*>Font<\/td>/);
  assert.match(email.html, /<td[^>]*>Warna<\/td>/);
});

test('paid owner email omits the overall board row when an old order has no saved board size', () => {
  const email = buildOwnerOrderEmail({ ...order, order_snapshot: {} });
  assert.doesNotMatch(email.html, /Saiz keseluruhan board/);
});

test('custom logo lead email escapes customer input and links to WhatsApp', () => {
  const email = buildCustomLogoLeadEmail({
    reference: 'LOGO_TEST_123',
    name: 'Ali <script>alert(1)</script>',
    phone: '0123456789',
    createdAt: '2026-09-29T04:00:00.000Z',
    source: 'Kad Design Custom website',
  });
  assert.match(email.subject, /Lead Custom Logo Baru/);
  assert.match(email.html, /Ali &lt;script&gt;alert/);
  assert.doesNotMatch(email.html, /<script>alert/);
  assert.match(email.html, /wa\.me\/60123456789/);
  assert.match(email.html, /Kad Design Custom website/);
  assert.match(email.html, /belum membuat pembayaran/i);
});
