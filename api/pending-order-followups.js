import { sendOwnerPendingEmail } from '../server/email.js';
import { fulfillPaidOrder } from '../server/paidOrder.js';
import { getOrder, getPendingFollowUpOrders, updateOrder } from '../server/supabase.js';
import { getBillTransaction } from '../server/toyyibpay.js';

const FOLLOW_UP_DELAY_MS = 30 * 60 * 1000;

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ success: false });
  }

  const authHeader = request.headers?.authorization || '';
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return response.status(401).json({ success: false });
  }

  const createdBefore = new Date(Date.now() - FOLLOW_UP_DELAY_MS).toISOString();
  let candidates;
  try {
    candidates = await getPendingFollowUpOrders(createdBefore);
  } catch (error) {
    console.error('Pending follow-up query failed', { message: error.message });
    return response.status(503).json({ success: false });
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  let reconciledPaid = 0;
  for (const candidate of candidates) {
    try {
      const order = await getOrder(candidate.reference);
      if (!order || !['unpaid', 'failed'].includes(order.payment_status) || order.followup_email_sent_at) {
        skipped += 1;
        continue;
      }

      if (order.bill_code) {
        const transaction = await getBillTransaction(order.bill_code, order.reference);
        if (!transaction) {
          skipped += 1;
          console.warn('Pending follow-up skipped because ToyyibPay status was unavailable', { reference: order.reference });
          continue;
        }
        if (String(transaction.billpaymentStatus) === '1') {
          await fulfillPaidOrder({
            reference: order.reference,
            billCode: order.bill_code,
            toyyibpayReference: transaction.billpaymentInvoiceNo,
            amount: transaction.billpaymentAmount,
            paymentPayload: {
              status: String(transaction.billpaymentStatus || ''),
              billcode: order.bill_code,
              refno: String(transaction.billpaymentInvoiceNo || ''),
              amount: String(transaction.billpaymentAmount || ''),
            },
            source: 'pending-cron-reconciliation',
          });
          reconciledPaid += 1;
          continue;
        }
      }

      await sendOwnerPendingEmail(order);
      await updateOrder(order.reference, { followup_email_sent_at: new Date().toISOString() });
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error('Pending order follow-up email failed', { reference: candidate.reference, message: error.message });
    }
  }

  response.setHeader('Cache-Control', 'no-store');
  return response.status(200).json({ success: true, checked: candidates.length, sent, reconciledPaid, skipped, failed });
}
