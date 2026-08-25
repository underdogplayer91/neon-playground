const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const displayValue = (value, fallback = '—') => escapeHtml(String(value ?? '').trim() || fallback).replaceAll('\n', '<br>');
const displayMoney = (value) => `RM${Number(value || 0).toFixed(2)}`;

const getColorSummary = (order) => {
  if (Array.isArray(order.word_colors) && order.word_colors.length) {
    return order.word_colors
      .filter((item) => item?.text || item?.label)
      .map((item) => `${item.text || 'Perkataan'} — ${item.label || 'Warna dipilih'}`)
      .join(', ');
  }
  return order.color_label || '—';
};

const getAddress = (order) => [
  order.address_line_1,
  order.address_line_2,
  [order.postcode, order.city].filter(Boolean).join(' '),
  order.state,
].filter(Boolean).join('\n');

const detailRow = (label, value) => `<tr>
  <td style="padding:9px 12px;border-bottom:1px solid #ece8e2;color:#726a61;font-size:12px;vertical-align:top">${escapeHtml(label)}</td>
  <td style="padding:9px 12px;border-bottom:1px solid #ece8e2;color:#171411;font-size:13px;font-weight:700;vertical-align:top">${displayValue(value)}</td>
</tr>`;

const emailShell = ({ eyebrow, title, intro, content, footer }) => `<!doctype html>
<html lang="ms"><body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,sans-serif;color:#171411">
  <div style="padding:28px 14px">
    <div style="max-width:640px;margin:0 auto;overflow:hidden;border:1px solid #ddd5cb;border-radius:16px;background:#ffffff">
      <div style="padding:28px;background:#11141b;color:#ffffff">
        <div style="margin-bottom:14px;color:#ff7066;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">${escapeHtml(eyebrow)}</div>
        <h1 style="margin:0;font-size:28px;line-height:1.12">${escapeHtml(title)}</h1>
        <p style="margin:14px 0 0;color:#c7c9cf;font-size:14px;line-height:1.6">${escapeHtml(intro)}</p>
      </div>
      <div style="padding:24px">${content}</div>
      <div style="padding:18px 24px;background:#faf8f4;color:#7a736b;font-size:11px;line-height:1.6">${escapeHtml(footer)}</div>
    </div>
  </div>
</body></html>`;

export function buildOwnerOrderEmail(order) {
  const subject = `Bayaran diterima · ${order.reference} · ${displayMoney(order.amount)}`;
  const content = `
    <div style="margin-bottom:18px;padding:14px 16px;border-left:4px solid #36b96b;background:#edf9f1;color:#176635;font-size:13px;font-weight:800">Pembayaran ToyyibPay telah disahkan.</div>
    <table role="presentation" style="width:100%;border-collapse:collapse">
      ${detailRow('Rujukan', order.reference)}
      ${detailRow('Nama pelanggan', order.customer_name)}
      ${detailRow('Telefon', order.customer_phone)}
      ${detailRow('Email', order.customer_email)}
      ${detailRow('Alamat', getAddress(order))}
      ${detailRow('Teks neon', order.neon_text || 'Design Custom')}
      ${detailRow('Font', order.font_name)}
      ${detailRow('Warna', getColorSummary(order))}
      ${detailRow('Pakej', order.package_name)}
      ${detailRow('Bayaran diterima', displayMoney(order.amount))}
      ${order.estimated_price ? detailRow('Anggaran harga penuh', displayMoney(order.estimated_price)) : ''}
    </table>
    <p style="margin:20px 0 0;color:#625b53;font-size:13px;line-height:1.65">Hubungi pelanggan melalui WhatsApp untuk pengesahan teks, font, warna dan mockup akhir.</p>`;

  return {
    subject,
    html: emailShell({
      eyebrow: 'Order baharu · Paid',
      title: 'Tempahan neon baharu diterima',
      intro: 'Semak butiran pelanggan dan hubungi mereka untuk pengesahan rekaan.',
      content,
      footer: 'Email automatik daripada pakarneonled.store. Data ini datang daripada rekod tempahan Supabase yang telah disahkan melalui callback ToyyibPay.',
    }),
  };
}

export function buildCustomerOrderEmail(order) {
  const subject = `Bayaran diterima — Tempahan ${order.reference}`;
  const isDeposit = order.package_tier === 'custom';
  const content = `
    <div style="margin-bottom:18px;padding:14px 16px;border-left:4px solid #36b96b;background:#edf9f1;color:#176635;font-size:13px;font-weight:800">Bayaran ${displayMoney(order.amount)} telah berjaya diterima.</div>
    <table role="presentation" style="width:100%;border-collapse:collapse">
      ${detailRow('Rujukan tempahan', order.reference)}
      ${detailRow('Teks neon', order.neon_text || 'Design Custom')}
      ${detailRow('Font', order.font_name)}
      ${detailRow('Warna', getColorSummary(order))}
      ${detailRow('Pakej', order.package_name)}
      ${detailRow(isDeposit ? 'Deposit dibayar' : 'Jumlah dibayar', displayMoney(order.amount))}
      ${order.estimated_price ? detailRow('Anggaran harga penuh', displayMoney(order.estimated_price)) : ''}
    </table>
    <p style="margin:20px 0 8px;color:#171411;font-size:14px;font-weight:800">Apa yang berlaku selepas ini?</p>
    <p style="margin:0;color:#625b53;font-size:13px;line-height:1.7">Designer kami akan menghubungi tuan/puan melalui WhatsApp untuk mengesahkan teks, font, warna dan mockup sebelum pengeluaran bermula.</p>`;

  return {
    subject,
    html: emailShell({
      eyebrow: 'Pakar LED & Neon by YH',
      title: `Terima kasih, ${order.customer_name || 'tuan/puan'}`,
      intro: 'Pembayaran anda telah diterima dan tempahan kini menunggu pengesahan designer.',
      content,
      footer: 'Simpan email ini sebagai rujukan tempahan. Balas email ini jika anda perlu berkongsi maklumat tambahan.',
    }),
  };
}

async function sendResendEmail({ to, replyTo, subject, html, idempotencyKey }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error('Konfigurasi Resend belum lengkap.');

  const result = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  const responseText = await result.text();
  if (!result.ok) throw new Error(`Resend gagal (${result.status}): ${responseText.slice(0, 300)}`);
  try { return JSON.parse(responseText); } catch { return null; }
}

export function sendOwnerOrderEmail(order) {
  const ownerEmail = process.env.ORDER_NOTIFICATION_EMAIL;
  if (!ownerEmail) throw new Error('Email penerima notifikasi belum ditetapkan.');
  const email = buildOwnerOrderEmail(order);
  return sendResendEmail({
    to: ownerEmail,
    replyTo: order.customer_email || undefined,
    ...email,
    idempotencyKey: `paid-owner/${order.reference}`,
  });
}

export function sendCustomerOrderEmail(order) {
  if (!order.customer_email) return null;
  const ownerEmail = process.env.ORDER_NOTIFICATION_EMAIL;
  const email = buildCustomerOrderEmail(order);
  return sendResendEmail({
    to: order.customer_email,
    replyTo: ownerEmail || undefined,
    ...email,
    idempotencyKey: `paid-customer/${order.reference}`,
  });
}
