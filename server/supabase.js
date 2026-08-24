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

export function buildOrderRecord({ order = {}, customer = {}, payment, reference }) {
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
  const result = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
      Prefer: prefer,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!result.ok) {
    const message = (await result.text()).slice(0, 500);
    console.error('Supabase order request failed', { path, method, status: result.status, message });
    throw new Error('Rekod tempahan tidak dapat disimpan. Sila cuba lagi.');
  }
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
