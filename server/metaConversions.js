import { createHash } from 'node:crypto';

const DEFAULT_PIXEL_ID = '510580329408580';
const DEFAULT_API_VERSION = 'v24.0';

const hash = (value) => createHash('sha256').update(value).digest('hex');

const normaliseText = (value) => String(value ?? '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]/g, '');

const normaliseEmail = (value) => String(value ?? '').trim().toLowerCase();

export const normalisePhone = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('60')) return digits;
  if (digits.startsWith('0')) return `6${digits}`;
  return digits;
};

const hashedArray = (value, normaliser = normaliseText) => {
  const normalised = normaliser(value);
  return normalised ? [hash(normalised)] : undefined;
};

const splitName = (fullName) => {
  const parts = String(fullName ?? '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : '',
  };
};

const compact = (object) => Object.fromEntries(
  Object.entries(object).filter(([, value]) => value !== undefined && value !== null && value !== ''),
);

export function buildMetaPurchaseEvent(order, eventTime = Math.floor(Date.now() / 1000)) {
  const tracking = order?.order_snapshot?.tracking || {};
  const { firstName, lastName } = splitName(order?.customer_name);
  const amount = Number(order?.amount) || 0;
  const reference = String(order?.reference || '').trim();
  const siteUrl = String(process.env.SITE_URL || 'https://www.pakarneonled.store').replace(/\/+$/, '');

  const userData = compact({
    em: hashedArray(order?.customer_email, normaliseEmail),
    ph: hashedArray(order?.customer_phone, normalisePhone),
    fn: hashedArray(firstName),
    ln: hashedArray(lastName),
    ct: hashedArray(order?.city),
    st: hashedArray(order?.state),
    zp: hashedArray(order?.postcode),
    country: hashedArray('my'),
    external_id: hashedArray(reference),
    client_ip_address: tracking.clientIpAddress,
    client_user_agent: tracking.clientUserAgent,
    fbc: tracking.fbc,
    fbp: tracking.fbp,
  });

  return {
    event_name: 'Purchase',
    event_time: eventTime,
    event_id: `purchase_${reference}`,
    event_source_url: `${siteUrl}/payment-status`,
    action_source: 'website',
    user_data: userData,
    custom_data: {
      currency: 'MYR',
      value: amount,
      order_id: reference,
      content_name: order?.package_name || 'Custom Neon LED',
      content_type: 'product',
      content_ids: [order?.package_tier || 'custom'],
      contents: [{
        id: order?.package_tier || 'custom',
        quantity: 1,
        item_price: amount,
      }],
      num_items: 1,
    },
  };
}

export async function sendMetaPurchase(order) {
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!accessToken) throw new Error('META_CAPI_ACCESS_TOKEN belum dikonfigurasi.');

  const pixelId = process.env.META_PIXEL_ID || DEFAULT_PIXEL_ID;
  const apiVersion = process.env.META_GRAPH_API_VERSION || DEFAULT_API_VERSION;
  const event = buildMetaPurchaseEvent(order);
  const body = { data: [event] };
  if (process.env.META_TEST_EVENT_CODE) body.test_event_code = process.env.META_TEST_EVENT_CODE;

  const result = await fetch(`https://graph.facebook.com/${apiVersion}/${encodeURIComponent(pixelId)}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const responseText = await result.text();
  let responseBody;
  try { responseBody = JSON.parse(responseText); } catch { responseBody = { raw: responseText.slice(0, 500) }; }

  if (!result.ok) {
    const message = responseBody?.error?.message || `Meta CAPI gagal dengan status ${result.status}.`;
    throw new Error(message);
  }

  return { eventId: event.event_id, response: responseBody };
}
