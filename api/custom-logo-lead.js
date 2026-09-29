import { randomUUID } from 'node:crypto';
import { parseRequestBody } from '../server/toyyibpay.js';
import { sendCustomLogoLeadEmail } from '../server/email.js';
import { normaliseCustomLogoLead } from '../server/customLogoLead.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Kaedah permintaan tidak dibenarkan.' });
  }

  try {
    const lead = normaliseCustomLogoLead(parseRequestBody(request.body));
    if (lead.isBot) return response.status(200).json({ ok: true });

    const reference = `LOGO_${Date.now().toString(36).toUpperCase()}_${randomUUID().slice(0, 6).toUpperCase()}`;
    await sendCustomLogoLeadEmail({
      ...lead,
      reference,
      createdAt: new Date().toISOString(),
      source: 'Kad Design Custom website',
    });

    response.setHeader('Cache-Control', 'no-store');
    return response.status(200).json({ ok: true });
  } catch (error) {
    const validationError = /nama penuh|nombor telefon Malaysia/i.test(error.message || '');
    return response.status(validationError ? 400 : 502).json({
      error: validationError ? error.message : 'Permintaan tidak dapat dihantar. Sila cuba semula.',
    });
  }
}
