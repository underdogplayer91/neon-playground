import { createHash, timingSafeEqual } from 'node:crypto';

export const PAYMENT_TIERS = Object.freeze({
  basic: { amount: 150, packageName: 'Pakej 8 Huruf', min: 1, max: 8 },
  plus: { amount: 200, packageName: 'Pakej 15 Huruf', min: 9, max: 15 },
  custom: { amount: 100, packageName: 'Deposit Design Custom', min: 16, max: Infinity },
});

const cleanText = (value, maxLength = 100) => String(value || '')
  .replace(/[^a-zA-Z0-9 _]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, maxLength);

export const countBillableCharacters = (value) => [...String(value || '').replace(/\s/g, '')].length;

export function resolvePayment(order = {}) {
  const text = String(order.text || '').trim();
  const characterCount = countBillableCharacters(text);
  let tier;

  if (!text && order.tier === 'custom') tier = 'custom';
  else if (characterCount >= 1 && characterCount <= 8) tier = 'basic';
  else if (characterCount <= 15) tier = 'plus';
  else tier = 'custom';

  const payment = PAYMENT_TIERS[tier];
  return { ...payment, tier, characterCount, text };
}

export function validateCheckout(order, customer) {
  const payment = resolvePayment(order);
  const name = String(customer?.name || '').trim();
  const phone = String(customer?.phone || '').replace(/[^0-9+]/g, '');
  const email = String(customer?.email || '').trim();
  const address1 = String(customer?.address1 || '').trim();
  const address2 = String(customer?.address2 || '').trim();
  const postcode = String(customer?.postcode || '').trim();
  const city = String(customer?.city || '').trim();
  const state = String(customer?.state || '').trim();

  if (!name || name.length > 100) throw new Error('Nama pelanggan tidak sah.');
  if (!/^\+?[0-9]{9,15}$/.test(phone)) throw new Error('Nombor telefon tidak sah.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Alamat email tidak sah.');
  if (!address1 || address1.length > 300) throw new Error('Alamat penghantaran tidak sah.');
  if (!/^[0-9]{5}$/.test(postcode)) throw new Error('Poskod tidak sah.');
  if (!city || city.length > 100 || !state || state.length > 100) throw new Error('Bandar atau negeri tidak sah.');
  if (!payment.text && payment.tier !== 'custom') throw new Error('Teks neon diperlukan.');

  return { payment, customer: { ...customer, name, phone, email, address1, address2, postcode, city, state } };
}

export function buildBillFields({ order, customer, siteUrl, secretKey, categoryCode }) {
  const { payment, customer: verifiedCustomer } = validateCheckout(order, customer);
  const reference = cleanText(order.reference || `YH ${Date.now()}`, 24).replace(/ /g, '_');
  const colors = Array.isArray(order.wordColors)
    ? [...new Set(order.wordColors.map((item) => item.label).filter(Boolean))].join(' ')
    : order.colorLabel;
  const description = cleanText([
    reference,
    payment.packageName,
    payment.text ? `Teks ${payment.text}` : 'Rekaan Custom',
    order.fontName ? `Font ${order.fontName}` : '',
  ].filter(Boolean).join(' '), 100);
  const address = [verifiedCustomer.address1, verifiedCustomer.address2, verifiedCustomer.postcode, verifiedCustomer.city, verifiedCustomer.state]
    .filter(Boolean).join(', ');
  const emailContent = [
    'Terima kasih kerana membuat tempahan dengan Pakar LED dan Neon by YH.',
    `Rujukan ${reference}.`,
    `Pakej ${payment.packageName}.`,
    payment.text ? `Teks neon ${payment.text}.` : 'Rekaan custom akan dibincangkan melalui WhatsApp.',
    order.fontName ? `Font ${order.fontName}.` : '',
    colors ? `Warna ${colors}.` : '',
    address ? `Alamat penghantaran ${address}.` : '',
    'Designer kami akan menghubungi anda melalui WhatsApp untuk pengesahan.',
  ].filter(Boolean).join(' ').slice(0, 1000);

  return {
    payment,
    reference,
    customer: verifiedCustomer,
    fields: {
      userSecretKey: secretKey,
      categoryCode,
      billName: 'Tempahan Pakar Neon LED',
      billDescription: description || 'Tempahan Custom Neon LED',
      billPriceSetting: '1',
      billPayorInfo: '1',
      billAmount: String(payment.amount * 100),
      billReturnUrl: `${siteUrl}/payment-status`,
      billCallbackUrl: `${siteUrl}/api/payment-callback`,
      billExternalReferenceNo: reference,
      billTo: cleanText(verifiedCustomer.name, 100),
      billEmail: verifiedCustomer.email,
      billPhone: verifiedCustomer.phone,
      billSplitPayment: '0',
      billPaymentChannel: '0',
      billContentEmail: emailContent,
      billChargeToPrepaid: '1',
      billExpiryDays: '3',
      enableFPXB2B: '1',
      chargeFPXB2B: '1',
      enableDuitNowQR: '1',
      chargeDuitNowQR: '0',
    },
  };
}

export const normaliseBaseUrl = (value) => String(value || 'https://toyyibpay.com').replace(/\/+$/, '');

export function verifyCallbackHash(payload, secretKey) {
  const expected = createHash('md5')
    .update(`${secretKey}${payload.status || ''}${payload.order_id || ''}${payload.refno || ''}ok`)
    .digest('hex');
  const received = String(payload.hash || '').toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(received)) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

export function parseRequestBody(body) {
  if (!body) return {};
  if (typeof body === 'object') return body;
  try {
    return JSON.parse(body);
  } catch {
    return Object.fromEntries(new URLSearchParams(body));
  }
}
