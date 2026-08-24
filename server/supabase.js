const limitText = (value, maxLength = 500) => String(value ?? '').trim().slice(0, maxLength);
const MOCKUP_BUCKET = 'order-mockups';
const MAX_MOCKUP_BYTES = 2 * 1024 * 1024;

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

export function decodeMockupPng(dataUrl) {
  if (!dataUrl) return null;
  const match = /^data:image\/png;base64,([a-zA-Z0-9+/=]+)$/.exec(String(dataUrl));
  if (!match || match[1].length > Math.ceil(MAX_MOCKUP_BYTES * 4 / 3) + 8) return null;
  const buffer = Buffer.from(match[1], 'base64');
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const hasHeader = buffer.length >= 24
    && buffer.subarray(0, 8).equals(pngSignature)
    && buffer.subarray(12, 16).toString('ascii') === 'IHDR';
  if (!hasHeader || buffer.length > MAX_MOCKUP_BYTES) return null;
  return buffer;
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

const storageHeaders = (secretKey, extra = {}) => ({
  apikey: secretKey,
  Authorization: `Bearer ${secretKey}`,
  ...extra,
});

async function ensureMockupBucket(url, secretKey) {
  const lookup = await fetch(`${url}/storage/v1/bucket/${MOCKUP_BUCKET}`, {
    headers: storageHeaders(secretKey),
  });
  if (lookup.ok) return;
  const lookupMessage = (await lookup.text()).slice(0, 300);
  if (lookup.status !== 404 && !/not[ _-]?found|does not exist/i.test(lookupMessage)) {
    throw new Error(`Bucket lookup failed (${lookup.status})`);
  }

  const creation = await fetch(`${url}/storage/v1/bucket`, {
    method: 'POST',
    headers: storageHeaders(secretKey, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      id: MOCKUP_BUCKET,
      name: MOCKUP_BUCKET,
      public: false,
      file_size_limit: MAX_MOCKUP_BYTES,
      allowed_mime_types: ['image/png'],
    }),
  });
  if (!creation.ok) {
    const creationMessage = (await creation.text()).slice(0, 300);
    if (creation.status !== 409 && !/already exists|duplicate/i.test(creationMessage)) {
      throw new Error(`Bucket creation failed (${creation.status})`);
    }
  }
}

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

export async function uploadMockupPng(reference, dataUrl) {
  const buffer = decodeMockupPng(dataUrl);
  if (!buffer) return null;

  const { url, secretKey } = getConfiguration();
  await ensureMockupBucket(url, secretKey);
  const safeReference = String(reference).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  const path = `${safeReference}/mockup.png`;
  const upload = await fetch(`${url}/storage/v1/object/${MOCKUP_BUCKET}/${path}`, {
    method: 'POST',
    headers: storageHeaders(secretKey, {
      'Content-Type': 'image/png',
      'Cache-Control': '3600',
      'x-upsert': 'true',
    }),
    body: buffer,
  });
  if (!upload.ok) {
    const message = (await upload.text()).slice(0, 300);
    throw new Error(`Mockup upload failed (${upload.status}): ${message}`);
  }
  return `${MOCKUP_BUCKET}/${path}`;
}
