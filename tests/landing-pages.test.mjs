import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePage } from '../src/landingRoutes.js';
import { getMetaAttribution } from '../src/metaPixel.js';
import { resolvePayment } from '../server/toyyibpay.js';
import { buildOrderRecord } from '../server/supabase.js';
import { buildOwnerOrderEmail, buildOwnerPendingEmail, buildCustomLogoLeadEmail } from '../server/email.js';
import { buildMetaPurchaseEvent } from '../server/metaConversions.js';
import { getClassicPackage, normalizeClassicCheckoutOrder } from '../src/classicPricing.js';
import { getClassicSizeGuide } from '../src/classicSizing.js';

test('routes separate homepage, classic, playground and shared checkout, including old hash links', () => {
  for (const [pathname, hash, expected] of [
    ['/', '', 'home'], ['/playground', '', 'playground'], ['/playground/', '', 'playground'],
    ['/neon-classic', '', 'neon-classic'], ['/checkout', '', 'checkout'], ['/payment-status', '', 'payment-status'],
    ['/', '#playground', 'playground'], ['/', '#playground-results', 'playground'], ['/', '#testimoni', 'home'],
    ['/missing', '', 'not-found'],
  ]) assert.equal(resolvePage({ pathname, hash }), expected);
});

test('campaign and Facebook attribution survive same-domain navigation and refresh', () => {
  const stored = new Map();
  global.window = { location: { pathname: '/', hash: '', search: '?utm_source=meta&utm_campaign=logo&utm_content=ad1&fbclid=click123', href: 'https://example.test/?utm_source=meta' }, sessionStorage: { getItem: (key) => stored.get(key), setItem: (key, value) => stored.set(key, value) } };
  global.document = { cookie: '' };
  try {
    const home = getMetaAttribution();
    assert.equal(home.landingSource, 'home');
    window.location = { pathname: '/neon-classic', hash: '', search: '', href: 'https://example.test/neon-classic' };
    const classic = getMetaAttribution();
    assert.equal(classic.landingSource, 'neon-classic');
    assert.equal(classic.utmCampaign, 'logo');
    assert.equal(classic.fbc, home.fbc);
    window.location = { pathname: '/checkout', hash: '', search: '', href: 'https://example.test/checkout' };
    const checkout = getMetaAttribution();
    assert.equal(checkout.landingSource, 'neon-classic');
    assert.equal(checkout.landingPage, 'https://example.test/neon-classic');
    assert.equal(checkout.fbclid, 'click123');
    assert.equal(checkout.utmContent, 'ad1');
    window.location = { pathname: '/playground', hash: '', search: '?utm_campaign=new', href: 'https://example.test/playground?utm_campaign=new' };
    const nextCampaign = getMetaAttribution();
    assert.equal(nextCampaign.utmCampaign, 'new');
    assert.equal(nextCampaign.fbclid, '');
    assert.equal(nextCampaign.utmContent, '');
  } finally { delete global.window; delete global.document; }
});

test('classic uses server-validated character packages while measured orders keep the RM250 threshold', () => {
  for (const [text, amount, tier] of [['KOPI JIWA', 150, 'basic'], ['ABCDEFGHI', 157, 'plus'], ['ABCDEFGHIJ', 164, 'plus'], ['ABCDEFGHIJKLMNO', 200, 'plus'], ['ABCDEFGHIJKLMNOP', 100, 'custom']]) {
    const payment = resolvePayment({ text, pricingModel: 'classic-package', estimatedPrice: 1 });
    assert.equal(payment.amount, amount);
    assert.equal(payment.tier, tier);
  }
  assert.equal(resolvePayment({ text: '', tier: 'custom', pricingModel: 'classic-package' }).amount, 100);
  assert.equal(resolvePayment({ text: 'ABCDEFGHIJKLMNOP', estimatedPrice: 212 }).amount, 212);
  assert.equal(resolvePayment({ text: 'KOPI', estimatedPrice: 251 }).amount, 100);
});

test('Classic increases evenly from RM150 at eight characters to RM200 at fifteen with whole-ringgit charges', () => {
  const amounts = [150, 157, 164, 171, 179, 186, 193, 200];
  for (let count = 1; count <= 7; count++) assert.equal(getClassicPackage(count).price, 150);
  for (const [index, amount] of amounts.entries()) {
    const count = index + 8;
    const text = 'A'.repeat(count);
    assert.equal(getClassicPackage(count).price, amount);
    const payment = resolvePayment({ text, pricingModel: 'classic-package', tier: 'custom', characterCount: 1, price: 1, estimatedPrice: 1 });
    assert.equal(payment.amount, amount);
    assert.equal(payment.characterCount, count);
    assert.ok(Number.isInteger(payment.amount));
  }
  assert.equal(resolvePayment({ text: 'ABCD EFGH\n🙂', pricingModel: 'classic-package' }).amount, 157);
  assert.equal(getClassicPackage(0).price, null);
  assert.equal(getClassicPackage(16).estimatedPrice, 212);
  assert.equal(resolvePayment({ text: 'A'.repeat(16), pricingModel: 'classic-package' }).amount, 100);
});

test('Classic checkout refreshes stored old prices without changing a v2 order or design', () => {
  const old = { text: 'ABCDEFGHIJ', pricingModel: 'classic-package', tier: 'plus', price: 200, estimatedPrice: 200, characterCount: 15, fontName: 'Beachfront', colorLabel: 'Pink' };
  const current = normalizeClassicCheckoutOrder(old);
  assert.equal(current.price, 164);
  assert.equal(current.estimatedPrice, 164);
  assert.equal(current.characterCount, 10);
  assert.equal(current.fontName, old.fontName);
  assert.equal(current.colorLabel, old.colorLabel);
  assert.equal(old.price, 200);
  const v2 = { text: 'ABCDEFGHIJ', estimatedPrice: 190, pricingModel: 'measured' };
  assert.equal(normalizeClassicCheckoutOrder(v2), v2);
  assert.equal(normalizeClassicCheckoutOrder(null), null);
});

test('Classic package guides use 60/85 cm widths, row-based height ranges and disappear for three rows', () => {
  for (const count of [1, 7, 8]) {
    assert.deepEqual(getClassicSizeGuide('A'.repeat(count)), { widthCm: 60, minHeightCm: 15, maxHeightCm: 20, lineCount: 1 });
  }
  for (const count of [9, 10, 14, 15]) {
    assert.deepEqual(getClassicSizeGuide('A'.repeat(count)), { widthCm: 85, minHeightCm: 15, maxHeightCm: 20, lineCount: 1 });
  }
  assert.deepEqual(getClassicSizeGuide('ABCD\nEFGH'), { widthCm: 60, minHeightCm: 20, maxHeightCm: 25, lineCount: 2 });
  assert.deepEqual(getClassicSizeGuide('ABCDEFGH\r\nIJKLMNO'), { widthCm: 85, minHeightCm: 20, maxHeightCm: 25, lineCount: 2 });
  assert.equal(getClassicSizeGuide('ABC\nDEF\nGHI'), null);
  assert.equal(getClassicSizeGuide('ABC\n\nDEF'), null);
  assert.equal(getClassicSizeGuide('A'.repeat(16)), null);
  assert.equal(getClassicSizeGuide(' \n '), null);
  assert.equal(getClassicSizeGuide(''), null);
  assert.equal(getClassicSizeGuide('ABCD EFGH').widthCm, 60);
});

test('landing source reaches order snapshot, both owner emails and Meta Purchase without a database migration', () => {
  const tracking = { landingSource: 'neon-classic', landingPage: 'https://example.test/neon-classic', utmSource: 'meta', utmCampaign: 'campaign1' };
  const record = buildOrderRecord({ order: { landingSource: 'neon-classic', pricingModel: 'classic-package', tracking, estimatedPrice: 150 }, payment: { text: 'KOPI', characterCount: 4, tier: 'basic', amount: 150, packageName: 'Pakej 8 Huruf' }, reference: 'YH_TEST', customer: {} });
  assert.equal(record.order_snapshot.landingSource, 'neon-classic');
  assert.equal(record.order_snapshot.tracking.utmCampaign, 'campaign1');
  for (const email of [buildOwnerOrderEmail(record), buildOwnerPendingEmail(record)]) {
    assert.match(email.html, /Landing page asal/);
    assert.match(email.html, /neon-classic/);
    assert.match(email.html, /campaign1/);
  }
  assert.equal(buildMetaPurchaseEvent(record).custom_data.landing_source, 'neon-classic');
  const leadEmail = buildCustomLogoLeadEmail({ name: 'Ali', phone: '0123456789', landingSource: 'home', tracking: { utmCampaign: '<campaign>' } });
  assert.match(leadEmail.html, /&lt;campaign&gt;/);
});
