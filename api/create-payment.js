import { buildBillFields, normaliseBaseUrl, parseRequestBody } from '../server/toyyibpay.js';
import { randomUUID } from 'node:crypto';
import { buildOrderRecord, createOrder, updateOrder } from '../server/supabase.js';

const createReference = () => `YH_${Date.now().toString(36).toUpperCase()}_${randomUUID().slice(0, 6).toUpperCase()}`;

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Kaedah permintaan tidak dibenarkan.' });
  }

  const secretKey = process.env.TOYYIBPAY_SECRET_KEY;
  const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE;
  const baseUrl = normaliseBaseUrl(process.env.TOYYIBPAY_BASE_URL);
  const siteUrl = normaliseBaseUrl(process.env.SITE_URL);
  if (!secretKey || !categoryCode || !siteUrl) {
    return response.status(503).json({ error: 'Konfigurasi pembayaran belum lengkap.' });
  }

  try {
    const payload = parseRequestBody(request.body);
    const trustedOrder = { ...payload.order, reference: createReference() };
    const { fields, payment, reference, customer } = buildBillFields({
      order: trustedOrder,
      customer: payload.customer,
      siteUrl,
      secretKey,
      categoryCode,
    });
    await createOrder(buildOrderRecord({ order: trustedOrder, customer, payment, reference }));

    const toyyibResponse = await fetch(`${baseUrl}/index.php/api/createBill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields),
    });
    const rawResult = await toyyibResponse.text();
    let result;
    try { result = JSON.parse(rawResult); } catch { result = null; }
    const billCode = Array.isArray(result) ? result[0]?.BillCode : null;

    if (!toyyibResponse.ok || !billCode) {
      console.error('ToyyibPay createBill failed', { status: toyyibResponse.status, result: rawResult.slice(0, 300) });
      await updateOrder(reference, { payment_status: 'bill_creation_failed' }).catch(() => {});
      return response.status(502).json({ error: 'ToyyibPay tidak dapat mencipta bil. Sila cuba lagi.' });
    }

    await updateOrder(reference, {
      bill_code: billCode,
      payment_status: 'unpaid',
    }).catch((error) => console.error('Order bill code update failed', { reference, message: error.message }));

    response.setHeader('Cache-Control', 'no-store');
    return response.status(200).json({
      paymentUrl: `${baseUrl}/${encodeURIComponent(billCode)}`,
      billCode,
      reference,
      tier: payment.tier,
      amount: payment.amount,
    });
  } catch (error) {
    return response.status(400).json({ error: error.message || 'Maklumat tempahan tidak sah.' });
  }
}
