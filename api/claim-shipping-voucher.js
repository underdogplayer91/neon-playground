import { createShippingVoucherClaim } from '../server/supabase.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Kaedah permintaan tidak dibenarkan.' });
  }

  const claimSession = String(request.body?.claimSession || '').trim();
  if (!/^[a-f0-9-]{36}$/i.test(claimSession)) {
    return response.status(400).json({ error: 'Sesi voucher tidak sah.' });
  }

  try {
    const voucher = await createShippingVoucherClaim(claimSession);
    response.setHeader('Cache-Control', 'no-store');
    return response.status(200).json(voucher);
  } catch (error) {
    console.error('Shipping voucher claim failed', { message: error.message });
    return response.status(503).json({ error: 'Voucher tidak dapat diclaim sekarang. Sila cuba lagi.' });
  }
}
