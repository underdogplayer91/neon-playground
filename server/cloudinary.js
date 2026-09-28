import { createHash } from 'node:crypto';

const MAX_PREVIEW_BYTES = 2 * 1024 * 1024;

const safeSegment = (value, fallback = 'design') => String(value || fallback)
  .replace(/[^a-zA-Z0-9_-]/g, '-')
  .replace(/-+/g, '-')
  .slice(0, 80);

export function validatePreviewDataUrl(value) {
  const match = String(value || '').match(/^data:image\/(png|jpeg|webp);base64,([a-zA-Z0-9+/=]+)$/);
  if (!match) throw new Error('Format gambar preview tidak sah.');
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > MAX_PREVIEW_BYTES) throw new Error('Gambar preview terlalu besar.');
  return { dataUrl: value, bytes: bytes.length, format: match[1] };
}

export function buildCloudinarySignature(parameters, secret) {
  const content = Object.entries(parameters)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return createHash('sha1').update(`${content}${secret}`).digest('hex');
}

async function uploadDesignPreviewToFolder({ dataUrl, reference, folder, label }) {
  validatePreviewDataUrl(dataUrl);
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error(`Konfigurasi Cloudinary ${label} belum lengkap.`);

  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${safeSegment(reference, 'TEST')}-${timestamp}`;
  const parameters = { folder, public_id: publicId, timestamp };
  const form = new FormData();
  form.append('file', dataUrl);
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('public_id', publicId);
  form.append('signature', buildCloudinarySignature(parameters, apiSecret));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.secure_url) throw new Error(`Upload Cloudinary gagal (${response.status}).`);
  return { secureUrl: result.secure_url, publicId: result.public_id, bytes: result.bytes };
}

export const uploadTestDesignPreview = ({ dataUrl, reference }) => uploadDesignPreviewToFolder({
  dataUrl,
  reference,
  folder: process.env.CLOUDINARY_TEST_FOLDER || 'pakar-neon/test-orders',
  label: 'test',
});

export const uploadOrderDesignPreview = ({ dataUrl, reference }) => uploadDesignPreviewToFolder({
  dataUrl,
  reference,
  folder: process.env.CLOUDINARY_ORDER_FOLDER || 'pakar-neon/orders',
  label: 'production',
});
