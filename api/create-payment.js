import { buildBillFields, normaliseBaseUrl, parseRequestBody } from '../server/toyyibpay.js';
import { randomUUID } from 'node:crypto';
import { waitUntil } from '@vercel/functions';
import { sendCustomerPendingEmail } from '../server/email.js';
import { buildOrderRecord, createOrder, updateOrder } from '../server/supabase.js';

const createReference = () => `YH_${Date.now().toString(36).toUpperCase()}_${randomUUID().slice(0, 6).toUpperCase()}`;

const getRequestHeader = (request, name) => {
  const value = request.headers?.[name];
  return Array.isArray(value) ? value[0] : String(value || '');
};

const getClientIpAddress = (request) => {
  const forwarded = getRequestHeader(request, 'x-forwarded-for').split(',')[0].trim();
  return forwarded || getRequestHeader(request, 'x-real-ip').trim();
};

export default async function handler(request, response) {
  const startedAt = Date.now();
  const requestId = getRequestHeader(request, 'x-vercel-id');
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
    const trustedOrder = {
      ...payload.order,
      reference: createReference(),
      tracking: {
        ...(payload.order?.tracking || {}),
        clientIpAddress: getClientIpAddress(request),
        clientUserAgent: getRequestHeader(request, 'user-agent'),
      },
    };
    const { fields, payment, reference, customer } = buildBillFields({
      order: trustedOrder,
      customer: payload.customer,
      siteUrl,
      secretKey,
      categoryCode,
    });
    const orderRecord = buildOrderRecord({ order: trustedOrder, customer, payment, reference });
    const orderStartedAt = Date.now();
    await createOrder(orderRecord);
    const orderSavedMs = Date.now() - orderStartedAt;

    const billStartedAt = Date.now();
    const toyyibResponse = await fetch(`${baseUrl}/index.php/api/createBill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields),
    });
    const rawResult = await toyyibResponse.text();
    const billCreatedMs = Date.now() - billStartedAt;
    let result;
    try { result = JSON.parse(rawResult); } catch { result = null; }
    const billCode = Array.isArray(result) ? result[0]?.BillCode : null;

    if (!toyyibResponse.ok || !billCode) {
      console.error('ToyyibPay createBill failed', { status: toyyibResponse.status, result: rawResult.slice(0, 300) });
      await updateOrder(reference, { payment_status: 'bill_creation_failed' }).catch(() => {});
      return response.status(502).json({ error: 'ToyyibPay tidak dapat mencipta bil. Sila cuba lagi.' });
    }

    const paymentUrl = `${baseUrl}/${encodeURIComponent(billCode)}`;
    const orderUpdateStartedAt = Date.now();
    await updateOrder(reference, {
      bill_code: billCode,
      payment_status: 'unpaid',
    }).catch((error) => console.error('Order bill code update failed', { reference, message: error.message }));
    const orderUpdatedMs = Date.now() - orderUpdateStartedAt;

    if (orderRecord.customer_email) {
      const emailStartedAt = Date.now();
      const emailTask = sendCustomerPendingEmail({
        ...orderRecord,
        bill_code: billCode,
        payment_status: 'unpaid',
        payment_url: paymentUrl,
      }).then(() => console.info(JSON.stringify({
        level: 'info',
        msg: 'checkout pending email sent',
        route: '/api/create-payment',
        reference,
        requestId,
        ms: Date.now() - emailStartedAt,
      }))).catch((error) => console.error(JSON.stringify({
        level: 'error',
        msg: 'checkout pending email failed',
        route: '/api/create-payment',
        reference,
        requestId,
        error: error.message,
        ms: Date.now() - emailStartedAt,
      })));
      waitUntil(emailTask);
    }

    console.info(JSON.stringify({
      level: 'info',
      msg: 'checkout payment ready',
      route: '/api/create-payment',
      reference,
      requestId,
      ms: Date.now() - startedAt,
      steps: {
        orderSavedMs,
        billCreatedMs,
        orderUpdatedMs,
      },
    }));

    response.setHeader('Cache-Control', 'no-store');
    return response.status(200).json({
      paymentUrl,
      billCode,
      reference,
      tier: payment.tier,
      amount: payment.amount,
    });
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      msg: 'checkout payment creation failed',
      route: '/api/create-payment',
      requestId,
      error: error.message,
      ms: Date.now() - startedAt,
    }));
    return response.status(400).json({ error: error.message || 'Maklumat tempahan tidak sah.' });
  }
}
