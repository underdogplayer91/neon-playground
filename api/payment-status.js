import { normaliseBaseUrl } from '../server/toyyibpay.js';

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
    const baseUrl = normaliseBaseUrl(process.env.TOYYIBPAY_BASE_URL);
    const toyyibResponse = await fetch(`${baseUrl}/index.php/api/getBillTransactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ billCode }),
    });
    const transactions = await toyyibResponse.json();
    const matching = Array.isArray(transactions)
      ? transactions.find((item) => !orderId || item.billExternalReferenceNo === orderId)
      : null;

    response.setHeader('Cache-Control', 'no-store');
    if (!matching) return response.status(200).json({ status: 'pending', reference: orderId, billCode });
    return response.status(200).json({
      status: STATUS_LABELS[String(matching.billpaymentStatus)] || 'pending',
      reference: matching.billExternalReferenceNo || orderId,
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

