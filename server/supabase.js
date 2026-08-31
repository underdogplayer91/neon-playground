const limitText = (value, maxLength = 500) => String(value ?? '').trim().slice(0, maxLength);

const cleanWordColors = (items) => Array.isArray(items)
  ? items.slice(0, 100).map((item) => ({
      wordIndex: Number.isInteger(item?.wordIndex) ? item.wordIndex : 0,
      text: limitText(item?.text, 80),
      colorId: limitText(item?.colorId, 40),
      label: limitText(item?.label, 80),
      value: limitText(item?.value, 40),
      glow: limitText(item?.glow, 40),
    }))
  : [];

const cleanTracking = (tracking = {}) => ({
  fbp: limitText(tracking.fbp, 200),
  fbc: limitText(tracking.fbc, 300),
  fbclid: limitText(tracking.fbclid, 300),
  utmSource: limitText(tracking.utmSource, 100),
  utmMedium: limitText(tracking.utmMedium, 100),
  utmCampaign: limitText(tracking.utmCampaign, 200),
  utmContent: limitText(tracking.utmContent, 200),
  utmTerm: limitText(tracking.utmTerm, 200),
  landingPage: limitText(tracking.landingPage, 1000),
  clientIpAddress: limitText(tracking.clientIpAddress, 100),
  clientUserAgent: limitText(tracking.clientUserAgent, 1000),
});

export function buildOrderRecord({ order = {}, customer = {}, payment, reference, shippingVoucher }) {
  const hasFreeShipping = Boolean(shippingVoucher?.active);
  return {
    reference,
    payment_status: 'creating_bill',
    order_status: 'new',
    customer_name: limitText(customer.name, 100),
    customer_phone: limitText(customer.phone, 20),
    customer_email: limitText(customer.email, 254) || null,
    address_line_1: limitText(customer.address1, 300),
    address_line_2: limitText(customer.address2, 300) || null,
    postcode: limitText(customer.postcode, 10),
    city: limitText(customer.city, 100),
    state: limitText(customer.state, 100),
    neon_text: limitText(payment.text, 1000) || null,
    font_name: limitText(order.fontName, 150) || null,
    color_label: limitText(order.colorLabel, 150) || null,
    word_colors: cleanWordColors(order.wordColors),
    package_tier: payment.tier,
    package_name: payment.packageName,
    amount: payment.amount,
    estimated_price: Number.isFinite(Number(order.estimatedPrice)) ? Number(order.estimatedPrice) : null,
    order_snapshot: {
      text: limitText(payment.text, 1000),
      fontName: limitText(order.fontName, 150),
      fontFamily: limitText(order.fontFamily, 150),
      colorMode: limitText(order.colorMode, 30),
      colorLabel: limitText(order.colorLabel, 150),
      colorValue: limitText(order.colorValue, 40),
      wordColors: cleanWordColors(order.wordColors),
      backgroundMode: limitText(order.backgroundMode, 30),
      sizeNote: limitText(order.sizeNote, 300),
      characterCount: payment.characterCount,
      shippingFeeOriginal: 20,
      shippingFee: hasFreeShipping ? 0 : 20,
      freeShipping: hasFreeShipping,
      shippingVoucherClaimId: shippingVoucher?.id || null,
      warrantyMonthsOriginal: 3,
      warrantyMonths: hasFreeShipping ? 6 : 3,
      tracking: cleanTracking(order.tracking),
    },
  };
}

export function mapToyyibPayStatus(status) {
  if (String(status) === '1') return 'paid';
  if (String(status) === '3') return 'failed';
  return 'pending';
}

const getConfiguration = () => {
  const url = String(process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey) throw new Error('Konfigurasi simpanan tempahan belum lengkap.');
  return { url, secretKey };
};

async function requestSupabase(path, { method = 'GET', body, prefer = 'return=minimal' } = {}) {
  const { url, secretKey } = getConfiguration();
  const headers = {
    apikey: secretKey,
    Authorization: `Bearer ${secretKey}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  const result = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const responseText = await result.text();

  if (!result.ok) {
    const message = responseText.slice(0, 500);
    console.error('Supabase order request failed', { path, method, status: result.status, message });
    throw new Error('Rekod tempahan tidak dapat disimpan. Sila cuba lagi.');
  }
  if (!responseText) return null;
  try { return JSON.parse(responseText); } catch { return null; }
}

export const createOrder = (record) => requestSupabase('orders', {
  method: 'POST',
  body: record,
});

export const updateOrder = (reference, changes) => {
  const query = new URLSearchParams({ reference: `eq.${reference}` });
  return requestSupabase(`orders?${query}`, {
    method: 'PATCH',
    body: { ...changes, updated_at: new Date().toISOString() },
  });
};

export const getOrder = async (reference) => {
  const query = new URLSearchParams({
    reference: `eq.${reference}`,
    select: '*',
    limit: '1',
  });
  const records = await requestSupabase(`orders?${query}`, { prefer: '' });
  return Array.isArray(records) ? records[0] || null : null;
};

export const getPendingFollowUpOrders = async (createdBefore, limit = 20) => {
  const query = new URLSearchParams({
    payment_status: 'in.(unpaid,failed)',
    created_at: `lte.${createdBefore}`,
    followup_email_sent_at: 'is.null',
    select: '*',
    order: 'created_at.asc',
    limit: String(limit),
  });
  const records = await requestSupabase(`orders?${query}`, { prefer: '' });
  return Array.isArray(records) ? records : [];
};

const normaliseVoucherClaim = (claim) => {
  const expiresAt = claim?.expires_at ? new Date(claim.expires_at).getTime() : 0;
  return {
    id: claim?.id || null,
    claimSession: limitText(claim?.claim_session, 100),
    claimedAt: claim?.claimed_at || null,
    expiresAt: claim?.expires_at || null,
    shippingValue: Number(claim?.shipping_value || 20),
    warrantyMonths: Number(claim?.warranty_months || 6),
    active: Boolean(claim?.id) && expiresAt > Date.now(),
  };
};

export const getShippingVoucherClaim = async (claimSession) => {
  const query = new URLSearchParams({
    claim_session: `eq.${limitText(claimSession, 100)}`,
    select: '*',
    limit: '1',
  });
  const records = await requestSupabase(`checkout_voucher_claims?${query}`, { prefer: '' });
  return normaliseVoucherClaim(Array.isArray(records) ? records[0] : null);
};

export const createShippingVoucherClaim = async (claimSession) => {
  const claimedAt = new Date();
  const expiresAt = new Date(claimedAt.getTime() + (10 * 60 * 1000));
  const query = new URLSearchParams({ on_conflict: 'claim_session' });
  const records = await requestSupabase(`checkout_voucher_claims?${query}`, {
    method: 'POST',
    body: {
      claim_session: limitText(claimSession, 100),
      shipping_value: 20,
      warranty_months: 6,
      claimed_at: claimedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    },
    prefer: 'resolution=ignore-duplicates,return=representation',
  });
  const inserted = Array.isArray(records) ? records[0] : null;
  return inserted ? normaliseVoucherClaim(inserted) : getShippingVoucherClaim(claimSession);
};

export const attachShippingVoucherClaim = async (claimSession, reference) => {
  const query = new URLSearchParams({ claim_session: `eq.${limitText(claimSession, 100)}` });
  return requestSupabase(`checkout_voucher_claims?${query}`, {
    method: 'PATCH',
    body: { order_reference: limitText(reference, 100), used_at: new Date().toISOString() },
  });
};
