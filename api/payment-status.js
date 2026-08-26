import { getBillTransaction } from '../server/toyyibpay.js';
import { fulfillPaidOrder } from '../server/paidOrder.js';

const STATUS_LABELS = { '1': 'success', '2': 'pending', '3': 'failed', '4': 'pending' };

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Kaedah permintaan tidak dibenarkan.' });
  }

  const billCode = String(request.query?.billcode || '');
  const orderId = String(request.query?.order_id || '');
  if (!/^[a-zA-Z0-9_-]{4,64}$/.test(billCode)) {
    return response.status(400).json({ error: 'Bill Code tidak sah.' });
  }

  try {
    const matching = await getBillTransaction(billCode, orderId);

    response.setHeader('Cache-Control', 'no-store');
    if (!matching) return response.status(200).json({ status: 'pending', reference: orderId, billCode });
    const reference = matching.billExternalReferenceNo || orderId;
    const status = STATUS_LABELS[String(matching.billpaymentStatus)] || 'pending';

    if (status === 'success' && reference) {
      try {
        await fulfillPaidOrder({
          reference,
          billCode,
          toyyibpayReference: matching.billpaymentInvoiceNo,
          amount: matching.billpaymentAmount,
          paymentPayload: {
            status: String(matching.billpaymentStatus || ''),
            billcode: billCode,
            refno: String(matching.billpaymentInvoiceNo || ''),
            amount: String(matching.billpaymentAmount || ''),
          },
          source: 'status-check',
        });
      } catch (error) {
        console.error('Paid status reconciliation failed', { reference, billCode, message: error.message });
      }
    }

    return response.status(200).json({
      status,
      reference,
      billCode,
      amount: matching.billpaymentAmount || null,
      invoice: matching.billpaymentInvoiceNo || null,
      paymentChannel: matching.billpaymentChannel || null,
    });
  } catch (error) {
    console.error('ToyyibPay status check failed', error);
    return response.status(502).json({ error: 'Status bayaran belum dapat disahkan.' });
  }
}
