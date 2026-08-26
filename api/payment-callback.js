import { parseRequestBody, verifyCallbackHash } from '../server/toyyibpay.js';
import { fulfillPaidOrder } from '../server/paidOrder.js';
import { mapToyyibPayStatus, updateOrder } from '../server/supabase.js';

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

  const paymentStatus = mapToyyibPayStatus(payload.status);
  if (paymentStatus === 'paid') {
    try {
      const { results } = await fulfillPaidOrder({
        reference: payload.order_id,
        billCode: payload.billcode,
        toyyibpayReference: payload.refno,
        amount: payload.amount,
        paymentPayload: {
          status: String(payload.status || ''),
          billcode: String(payload.billcode || ''),
          refno: String(payload.refno || ''),
          amount: String(payload.amount || ''),
        },
        source: 'callback',
      });
      if (results.ownerEmail === 'failed') return response.status(503).send('Owner notification failed');
    } catch (error) {
      console.error('Verified payment could not fulfill order', { order_id: payload.order_id, message: error.message });
      return response.status(503).send('Order fulfillment failed');
    }
  } else {
    try {
      await updateOrder(payload.order_id, {
        bill_code: String(payload.billcode || '') || null,
        toyyibpay_reference: String(payload.refno || '') || null,
        payment_status: paymentStatus,
        payment_payload: {
          status: String(payload.status || ''),
          billcode: String(payload.billcode || ''),
          refno: String(payload.refno || ''),
          amount: String(payload.amount || ''),
        },
      });
    } catch (error) {
      console.error('Verified payment could not update order', { order_id: payload.order_id, message: error.message });
      return response.status(503).send('Order update failed');
    }
  }
  return response.status(200).send('OK');
}
