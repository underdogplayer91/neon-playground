import { parseRequestBody } from '../server/toyyibpay.js';
import { uploadTestDesignPreview } from '../server/cloudinary.js';
import { sendTestDesignEmail } from '../server/email.js';

const clean = (value, max = 300) => String(value || '').trim().slice(0, max);

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Kaedah permintaan tidak dibenarkan.' });
  }
  if (process.env.DESIGN_CAPTURE_TEST_MODE !== 'true') {
    return response.status(404).json({ error: 'Mod ujian tidak aktif.' });
  }

  try {
    const body = parseRequestBody(request.body);
    const reference = clean(body.reference, 80) || `TEST-${Date.now().toString(36).toUpperCase()}`;
    const upload = await uploadTestDesignPreview({ dataUrl: body.previewDataUrl, reference });
    await sendTestDesignEmail({
      reference,
      previewUrl: upload.secureUrl,
      text: clean(body.text, 1000),
      textSize: clean(body.textSize),
      backboardSize: clean(body.backboardSize),
      estimatedPrice: Number(body.estimatedPrice) || 0,
      fonts: clean(body.fonts, 500),
      colours: clean(body.colours, 500),
    });
    response.setHeader('Cache-Control', 'no-store');
    return response.status(200).json({ ok: true, reference, previewUrl: upload.secureUrl });
  } catch (error) {
    return response.status(400).json({ error: error.message || 'Ujian gambar dan email gagal.' });
  }
}
