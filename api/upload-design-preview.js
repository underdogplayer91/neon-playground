import { parseRequestBody } from '../server/toyyibpay.js';
import { uploadOrderDesignPreview, uploadTestDesignPreview } from '../server/cloudinary.js';

const cleanReference = (value) => String(value || '')
  .trim()
  .replace(/[^a-zA-Z0-9_-]/g, '-')
  .slice(0, 80);

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Kaedah permintaan tidak dibenarkan.' });
  }

  try {
    const body = parseRequestBody(request.body);
    const reference = cleanReference(body.reference);
    if (!reference) return response.status(400).json({ error: 'Rujukan design tidak sah.' });
    const testMode = process.env.DESIGN_CAPTURE_TEST_MODE === 'true';
    const upload = testMode
      ? await uploadTestDesignPreview({ dataUrl: body.previewDataUrl, reference })
      : await uploadOrderDesignPreview({ dataUrl: body.previewDataUrl, reference });
    response.setHeader('Cache-Control', 'no-store');
    return response.status(200).json({
      ok: true,
      previewUrl: upload.secureUrl,
      previewPublicId: upload.publicId,
      mode: testMode ? 'test' : 'production',
    });
  } catch (error) {
    return response.status(400).json({ error: error.message || 'Gambar design tidak dapat dimuat naik.' });
  }
}
