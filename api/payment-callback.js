import { parseRequestBody, verifyCallbackHash } from '../server/toyyibpay.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).send('Method Not Allowed');
  }

  const secretKey = process.env.TOYYIBPAY_SECRET_KEY;
  if (!secretKey) return response.status(503).send('Payment configuration missing');

  const payload = parseRequestBody(request.body);
  if (!verifyCallbackHash(payload, secretKey)) {
    console.warn('Rejected ToyyibPay callback', { billcode: payload.billcode, order_id: payload.order_id });
    return response.status(401).send('Invalid callback');
  }

  console.info('Verified ToyyibPay callback', {
    billcode: payload.billcode,
    order_id: payload.order_id,
    refno: payload.refno,
    status: payload.status,
    amount: payload.amount,
  });
  return response.status(200).send('OK');
}

