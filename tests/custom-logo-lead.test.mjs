import assert from 'node:assert/strict';
import test from 'node:test';
import customLogoLeadHandler from '../api/custom-logo-lead.js';
import { normaliseCustomLogoLead, toMalaysiaWhatsAppNumber } from '../server/customLogoLead.js';

const createResponse = () => ({
  statusCode: 200,
  headers: {},
  payload: null,
  setHeader(name, value) { this.headers[name] = value; },
  status(code) { this.statusCode = code; return this; },
  json(payload) { this.payload = payload; return this; },
});

test('normalises a valid Malaysian custom logo lead', () => {
  assert.deepEqual(normaliseCustomLogoLead({ name: '  Ali   Ahmad ', phone: '012-345 6789' }), {
    name: 'Ali Ahmad',
    phone: '0123456789',
    honeypot: '',
    isBot: false,
  });
  assert.equal(toMalaysiaWhatsAppNumber('0123456789'), '60123456789');
});

test('rejects missing names and invalid Malaysian phone numbers', () => {
  assert.throws(() => normaliseCustomLogoLead({ name: '', phone: '0123456789' }), /nama penuh/i);
  assert.throws(() => normaliseCustomLogoLead({ name: 'Ali', phone: '1234' }), /nombor telefon Malaysia/i);
});

test('silently marks honeypot submissions as bots', () => {
  assert.equal(normaliseCustomLogoLead({ name: 'Bot', phone: '0123456789', companyWebsite: 'https://spam.test' }).isBot, true);
});

test('valid endpoint submission sends exactly one owner email', { concurrency: false }, async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.RESEND_FROM_EMAIL;
  const originalOwner = process.env.ORDER_NOTIFICATION_EMAIL;
  const requests = [];
  process.env.RESEND_API_KEY = 're_test';
  process.env.RESEND_FROM_EMAIL = 'Pakar Neon <orders@example.com>';
  process.env.ORDER_NOTIFICATION_EMAIL = 'owner@example.com';
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return { ok: true, status: 200, text: async () => JSON.stringify({ id: 'email_123' }) };
  };

  try {
    const response = createResponse();
    await customLogoLeadHandler({ method: 'POST', body: { name: 'Ali Ahmad', phone: '0123456789', companyWebsite: '' } }, response);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.payload, { ok: true });
    assert.equal(requests.length, 1);
    const emailPayload = JSON.parse(requests[0].options.body);
    assert.deepEqual(emailPayload.to, ['owner@example.com']);
    assert.match(emailPayload.subject, /Lead Custom Logo Baru/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = originalApiKey;
    if (originalFrom === undefined) delete process.env.RESEND_FROM_EMAIL; else process.env.RESEND_FROM_EMAIL = originalFrom;
    if (originalOwner === undefined) delete process.env.ORDER_NOTIFICATION_EMAIL; else process.env.ORDER_NOTIFICATION_EMAIL = originalOwner;
  }
});

test('endpoint returns a retryable error when Resend fails', { concurrency: false }, async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.RESEND_FROM_EMAIL;
  const originalOwner = process.env.ORDER_NOTIFICATION_EMAIL;
  process.env.RESEND_API_KEY = 're_test';
  process.env.RESEND_FROM_EMAIL = 'Pakar Neon <orders@example.com>';
  process.env.ORDER_NOTIFICATION_EMAIL = 'owner@example.com';
  globalThis.fetch = async () => ({ ok: false, status: 500, text: async () => 'service unavailable' });

  try {
    const response = createResponse();
    await customLogoLeadHandler({ method: 'POST', body: { name: 'Ali Ahmad', phone: '0123456789' } }, response);
    assert.equal(response.statusCode, 502);
    assert.match(response.payload.error, /cuba semula/i);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = originalApiKey;
    if (originalFrom === undefined) delete process.env.RESEND_FROM_EMAIL; else process.env.RESEND_FROM_EMAIL = originalFrom;
    if (originalOwner === undefined) delete process.env.ORDER_NOTIFICATION_EMAIL; else process.env.ORDER_NOTIFICATION_EMAIL = originalOwner;
  }
});
