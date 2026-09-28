import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCloudinarySignature, validatePreviewDataUrl } from '../server/cloudinary.js';
import { buildTestDesignEmail } from '../server/email.js';

test('Cloudinary signature uses sorted upload parameters', () => {
  assert.equal(buildCloudinarySignature({ timestamp: 123, folder: 'pakar-neon/test-orders', public_id: 'YH-TEST' }, 'secret'), '75fd46b7e96ef5de213ea210d7b2e1925f4418f4');
});

test('preview accepts small image data URLs and rejects arbitrary content', () => {
  assert.equal(validatePreviewDataUrl('data:image/png;base64,aGVsbG8=').bytes, 5);
  assert.throws(() => validatePreviewDataUrl('https://example.com/image.png'), /Format gambar/);
});

test('test email contains image URL, dimensions, and a clear test label', () => {
  const email = buildTestDesignEmail({ reference: 'YH-TEST', previewUrl: 'https://res.cloudinary.com/test/image.jpg', text: 'Pakar Neon', textSize: '80 × 20 cm', backboardSize: '86 × 26 cm', fonts: 'Amanda', colours: 'Pink', estimatedPrice: 350 });
  assert.match(email.subject, /^\[TEST\]/);
  assert.match(email.html, /res\.cloudinary\.com\/test\/image\.jpg/);
  assert.match(email.html, /80 × 20 cm/);
  assert.match(email.html, /Tiada bil ToyyibPay/);
});
