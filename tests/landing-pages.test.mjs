import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePage } from '../src/landingRoutes.js';
import { getMetaAttribution } from '../src/metaPixel.js';
import { resolvePayment } from '../server/toyyibpay.js';
import { buildOrderRecord } from '../server/supabase.js';
import { buildOwnerOrderEmail, buildOwnerPendingEmail, buildCustomLogoLeadEmail } from '../server/email.js';
import { buildMetaPurchaseEvent } from '../server/metaConversions.js';

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
  for (const [text, amount, tier] of [['KOPI JIWA', 150, 'basic'], ['ABCDEFGHI', 200, 'plus'], ['ABCDEFGHIJKLMNO', 200, 'plus'], ['ABCDEFGHIJKLMNOP', 100, 'custom']]) {
    const payment = resolvePayment({ text, pricingModel: 'classic-package', estimatedPrice: 1 });
    assert.equal(payment.amount, amount);
    assert.equal(payment.tier, tier);
  }
  assert.equal(resolvePayment({ text: '', tier: 'custom', pricingModel: 'classic-package' }).amount, 100);
  assert.equal(resolvePayment({ text: 'ABCDEFGHIJKLMNOP', estimatedPrice: 212 }).amount, 212);
  assert.equal(resolvePayment({ text: 'KOPI', estimatedPrice: 251 }).amount, 100);
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
