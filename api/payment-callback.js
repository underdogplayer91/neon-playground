import { parseRequestBody, verifyCallbackHash } from '../server/toyyibpay.js';
import { sendCustomerOrderEmail, sendOwnerOrderEmail } from '../server/email.js';
import { sendMetaPurchase } from '../server/metaConversions.js';
import { getOrder, mapToyyibPayStatus, updateOrder } from '../server/supabase.js';

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
      ...(paymentStatus === 'paid' ? { paid_at: new Date().toISOString(), order_status: 'paid' } : {}),
    });
  } catch (error) {
    console.error('Verified payment could not update order', { order_id: payload.order_id, message: error.message });
    return response.status(503).send('Order update failed');
  }

  if (paymentStatus === 'paid') {
    try {
      const order = await getOrder(payload.order_id);
      if (!order) throw new Error('Order tidak dijumpai selepas pembayaran disahkan.');

      if (!order.meta_purchase_sent_at) {
        try {
          const metaResult = await sendMetaPurchase(order);
          await updateOrder(order.reference, {
            meta_purchase_sent_at: new Date().toISOString(),
            meta_purchase_event_id: metaResult.eventId,
            meta_purchase_response: metaResult.response,
          });
        } catch (error) {
          console.error('Meta Purchase event failed', { reference: order.reference, message: error.message });
        }
      }

      if (!order.email_notified_at) {
        try {
          await sendOwnerOrderEmail(order);
          await updateOrder(order.reference, { email_notified_at: new Date().toISOString() });
        } catch (error) {
          console.error('Owner order email failed', { reference: order.reference, message: error.message });
        }
      }

      if (order.customer_email && !order.customer_email_sent_at) {
        try {
          await sendCustomerOrderEmail(order);
          await updateOrder(order.reference, { customer_email_sent_at: new Date().toISOString() });
        } catch (error) {
          console.error('Customer order email failed', { reference: order.reference, message: error.message });
        }
      }
    } catch (error) {
      console.error('Paid order notification setup failed', { order_id: payload.order_id, message: error.message });
    }
  }
  return response.status(200).send('OK');
}
