import { sendCustomerOrderEmail, sendOwnerOrderEmail } from './email.js';
import { sendMetaPurchase } from './metaConversions.js';
import { getOrder, updateOrder } from './supabase.js';

const amountsMatch = (trustedAmount, paidAmount) => {
  if (paidAmount === undefined || paidAmount === null || paidAmount === '') return true;
  const trusted = Number(trustedAmount);
  const paid = Number(paidAmount);
  return Number.isFinite(trusted) && Number.isFinite(paid) && Math.abs(trusted - paid) < 0.001;
};

export function validatePaidOrder(order, { billCode, amount } = {}) {
  if (!order) throw new Error('Order tidak dijumpai selepas pembayaran disahkan.');
  if (billCode && order.bill_code && String(order.bill_code) !== String(billCode)) {
    throw new Error('Bill Code pembayaran tidak sepadan dengan order.');
  }
  if (!amountsMatch(order.amount, amount)) {
    throw new Error('Jumlah pembayaran tidak sepadan dengan jumlah order.');
  }
}

export async function fulfillPaidOrder({
  reference,
  billCode,
  toyyibpayReference,
  amount,
  paymentPayload,
  source = 'toyyibpay',
}) {
  const currentOrder = await getOrder(reference);
  validatePaidOrder(currentOrder, { billCode, amount });

  const paidAt = currentOrder.paid_at || new Date().toISOString();
  await updateOrder(reference, {
    bill_code: String(billCode || currentOrder.bill_code || '') || null,
    toyyibpay_reference: String(toyyibpayReference || currentOrder.toyyibpay_reference || '') || null,
    payment_status: 'paid',
    order_status: 'paid',
    paid_at: paidAt,
    ...(paymentPayload ? { payment_payload: paymentPayload } : {}),
  });

  const order = { ...currentOrder, payment_status: 'paid', order_status: 'paid', paid_at: paidAt };
  const results = { ownerEmail: 'already-sent', customerEmail: 'not-required', metaPurchase: 'already-sent' };

  // Email operasi ialah tindakan paling penting. Hantar sebelum integrasi pemasaran
  // supaya kelewatan Meta tidak boleh menghalang notifikasi tempahan.
  if (!order.email_notified_at) {
    try {
      await sendOwnerOrderEmail(order);
      await updateOrder(reference, { email_notified_at: new Date().toISOString() });
      results.ownerEmail = 'sent';
    } catch (error) {
      results.ownerEmail = 'failed';
      console.error('Owner order email failed', { reference, source, message: error.message });
    }
  }

  if (order.customer_email && !order.customer_email_sent_at) {
    try {
      await sendCustomerOrderEmail(order);
      await updateOrder(reference, { customer_email_sent_at: new Date().toISOString() });
      results.customerEmail = 'sent';
    } catch (error) {
      results.customerEmail = 'failed';
      console.error('Customer order email failed', { reference, source, message: error.message });
    }
  }

  if (!order.meta_purchase_sent_at) {
    try {
      const metaResult = await sendMetaPurchase(order);
      await updateOrder(reference, {
        meta_purchase_sent_at: new Date().toISOString(),
        meta_purchase_event_id: metaResult.eventId,
        meta_purchase_response: metaResult.response,
      });
      results.metaPurchase = 'sent';
    } catch (error) {
      results.metaPurchase = 'failed';
      console.error('Meta Purchase event failed', { reference, source, message: error.message });
    }
  }

  console.info('Paid order fulfillment completed', { reference, source, ...results });
  return { order, results };
}
