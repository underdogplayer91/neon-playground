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

const getWhatsAppPhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('60')) return digits;
  if (digits.startsWith('0')) return `6${digits}`;
  return digits;
};

const buildWhatsAppLink = (order, status) => {
  const phone = getWhatsAppPhone(order.customer_phone);
  if (!phone) return '';
  const colorSummary = getColorSummary(order);
  const message = status === 'paid'
    ? `Salam ${order.customer_name || 'tuan/puan'}, saya designer daripada Pakar LED & Neon by YH.\n\nBayaran ${displayMoney(order.amount)} untuk tempahan ${order.reference} telah berjaya diterima. Terima kasih kerana membuat tempahan dengan kami.\n\nRingkasan rekaan anda:\n\nTeks: ${order.neon_text || 'Design Custom'}\nFont: ${order.font_name || 'Akan dibincangkan'}\nWarna: ${colorSummary}\nPakej: ${order.package_name || 'Design Custom'}\n\nKami akan membantu mengesahkan rekaan dan menyediakan mockup akhir sebelum proses pengeluaran dimulakan.\n\nJika ada perubahan atau maklumat tambahan, boleh beritahu saya melalui WhatsApp ini ya 😊\n\nWebsite rasmi:\nhttps://www.pakarneonled.store`
    : `Salam ${order.customer_name || 'tuan/puan'}, saya dari Pakar LED & Neon by YH.\n\nKami telah menerima pilihan rekaan neon anda:\n\nTeks: ${order.neon_text || 'Design Custom'}\nFont: ${order.font_name || 'Akan dibincangkan'}\nWarna: ${colorSummary}\nPakej: ${order.package_name || 'Design Custom'}\nJumlah: ${displayMoney(order.amount)}\n\nKami perasan pembayaran untuk tempahan ${order.reference} masih belum selesai. Ada masalah ketika membuat bayaran atau ada bahagian design yang anda mahu bincangkan dahulu?\n\nKami sedia membantu 😊\n\nWebsite rasmi:\nhttps://www.pakarneonled.store`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};

const whatsappButton = (href, label) => href
  ? `<div style="margin-top:20px"><a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#1fa855;color:#ffffff;font-size:13px;font-weight:800;text-decoration:none">${escapeHtml(label)}</a></div>`
  : '';

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

const getOrderDesign = (order) => {
  const snapshot = order?.order_snapshot && typeof order.order_snapshot === 'object' ? order.order_snapshot : {};
  return {
    previewUrl: String(snapshot.previewUrl || '').trim(),
    layers: Array.isArray(snapshot.designLayers) ? snapshot.designLayers : [],
    textSize: snapshot.sizeNote || '',
    backboardSize: snapshot.backboardSizeNote || '',
  };
};

const designPreviewBlock = (order) => {
  const design = getOrderDesign(order);
  if (!design.previewUrl) return '';
  return `<div style="margin:18px 0">
    <img src="${escapeHtml(design.previewUrl)}" alt="Preview design neon pelanggan" style="display:block;width:100%;height:auto;border-radius:12px;background:#11131a" />
    <div style="margin-top:7px;color:#756e66;font-size:10px">Snapshot design yang dihantar oleh customer.</div>
  </div>`;
};

const designLayerTable = (order) => {
  const design = getOrderDesign(order);
  if (!design.layers.length) return '';
  return `<div style="margin:22px 0 8px;color:#18191d;font-size:14px;font-weight:900">Detail setiap perkataan</div>
    <table role="presentation" style="width:100%;border-collapse:collapse;border:1px solid #ddd7ce">
      <tr style="background:#11131a;color:#fff">
        <th style="padding:10px 8px;text-align:left;font-size:11px">Perkataan</th>
        <th style="padding:10px 8px;text-align:left;font-size:11px">Font</th>
        <th style="padding:10px 8px;text-align:left;font-size:11px">Warna</th>
        <th style="padding:10px 8px;text-align:left;font-size:11px">Saiz</th>
        <th style="padding:10px 8px;text-align:left;font-size:11px">Putaran</th>
      </tr>
      ${design.layers.map((layer) => `<tr>
        <td style="padding:10px 8px;border-top:1px solid #ddd7ce;font-size:12px;font-weight:800">${displayValue(layer.word)}</td>
        <td style="padding:10px 8px;border-top:1px solid #ddd7ce;font-size:12px">${displayValue(layer.font)}</td>
        <td style="padding:10px 8px;border-top:1px solid #ddd7ce;font-size:12px">${displayValue(layer.colour)}</td>
        <td style="padding:10px 8px;border-top:1px solid #ddd7ce;font-size:12px;white-space:nowrap">${Math.round(Number(layer.widthCm) || 0)} × ${Math.round(Number(layer.heightCm) || 0)} cm</td>
        <td style="padding:10px 8px;border-top:1px solid #ddd7ce;font-size:12px;white-space:nowrap">${Math.round(Number(layer.rotationDeg) || 0)}°</td>
      </tr>`).join('')}
    </table>`;
};

export function buildOwnerOrderEmail(order) {
  const subject = `Bayaran diterima · ${order.reference} · ${displayMoney(order.amount)}`;
  const whatsappLink = buildWhatsAppLink(order, 'paid');
  const content = `
    <div style="margin-bottom:18px;padding:14px 16px;border-left:4px solid #36b96b;background:#edf9f1;color:#176635;font-size:13px;font-weight:800">Pembayaran ToyyibPay telah disahkan.</div>
    ${designPreviewBlock(order)}
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
    ${designLayerTable(order)}
    <p style="margin:20px 0 0;color:#625b53;font-size:13px;line-height:1.65">Hubungi customer untuk memperkenalkan diri, mengesahkan maklumat rekaan dan menerangkan proses seterusnya sebelum pengeluaran dimulakan.</p>
    ${whatsappButton(whatsappLink, 'WhatsApp Customer — Sahkan Rekaan')}`;

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

export function buildOwnerPendingEmail(order) {
  const subject = `Tempahan menunggu bayaran · ${order.reference}`;
  const whatsappLink = buildWhatsAppLink(order, 'pending');
  const content = `
    <div style="margin-bottom:18px;padding:14px 16px;border-left:4px solid #e3a008;background:#fff8e6;color:#7a5200;font-size:13px;font-weight:800">Customer telah mengisi maklumat tempahan, tetapi pembayaran masih belum diselesaikan.</div>
    ${designPreviewBlock(order)}
    <table role="presentation" style="width:100%;border-collapse:collapse">
      ${detailRow('Rujukan', order.reference)}
      ${detailRow('Nama customer', order.customer_name)}
      ${detailRow('Telefon', order.customer_phone)}
      ${detailRow('Email', order.customer_email)}
      ${detailRow('Teks neon', order.neon_text || 'Design Custom')}
      ${detailRow('Font', order.font_name)}
      ${detailRow('Warna', getColorSummary(order))}
      ${detailRow('Pakej', order.package_name)}
      ${detailRow('Jumlah bayaran', displayMoney(order.amount))}
      ${detailRow('Masa tempahan', order.created_at)}
    </table>
    ${designLayerTable(order)}
    <p style="margin:20px 0 0;color:#625b53;font-size:13px;line-height:1.65">Hubungi customer untuk bertanya jika mereka menghadapi masalah pembayaran atau mahu membuat perubahan pada design.</p>
    ${whatsappButton(whatsappLink, 'WhatsApp Customer — Bantu Selesaikan Bayaran')}`;

  return {
    subject,
    html: emailShell({
      eyebrow: 'Order belum dibayar · Follow-up',
      title: 'Tempahan menunggu pembayaran',
      intro: 'Customer telah membuka bil ToyyibPay tetapi pembayaran belum disahkan. Simpan ringkasan ini untuk follow-up jika transaksi tidak diselesaikan.',
      content,
      footer: 'Email automatik daripada pakarneonled.store. Semak status terkini dalam Supabase sebelum membuat susulan jika perlu.',
    }),
  };
}

export function buildTestDesignEmail(design) {
  const layerRows = Array.isArray(design.layers) && design.layers.length
    ? `<div style="margin:22px 0 8px;color:#18191d;font-size:14px;font-weight:900">Detail setiap perkataan</div>
      <table role="presentation" style="width:100%;border-collapse:collapse;border:1px solid #ddd7ce">
        <tr style="background:#11131a;color:#fff">
          <th style="padding:10px 8px;text-align:left;font-size:11px">Perkataan</th>
          <th style="padding:10px 8px;text-align:left;font-size:11px">Font</th>
          <th style="padding:10px 8px;text-align:left;font-size:11px">Warna</th>
          <th style="padding:10px 8px;text-align:left;font-size:11px">Saiz</th>
          <th style="padding:10px 8px;text-align:left;font-size:11px">Putaran</th>
        </tr>
        ${design.layers.map((layer) => `<tr>
          <td style="padding:10px 8px;border-top:1px solid #ddd7ce;font-size:12px;font-weight:800">${displayValue(layer.word)}</td>
          <td style="padding:10px 8px;border-top:1px solid #ddd7ce;font-size:12px">${displayValue(layer.font)}</td>
          <td style="padding:10px 8px;border-top:1px solid #ddd7ce;font-size:12px">${displayValue(layer.colour)}</td>
          <td style="padding:10px 8px;border-top:1px solid #ddd7ce;font-size:12px;white-space:nowrap">${Math.round(Number(layer.widthCm) || 0)} × ${Math.round(Number(layer.heightCm) || 0)} cm</td>
          <td style="padding:10px 8px;border-top:1px solid #ddd7ce;font-size:12px;white-space:nowrap">${Math.round(Number(layer.rotationDeg) || 0)}°</td>
        </tr>`).join('')}
      </table>`
    : '';
  const content = `
    <div style="margin-bottom:18px;padding:14px 16px;border-left:4px solid #2a7fff;background:#eef5ff;color:#184f9b;font-size:13px;font-weight:800">Ini ialah ujian snapshot daripada Vercel Preview. Tiada bil ToyyibPay atau order live dicipta.</div>
    <img src="${escapeHtml(design.previewUrl)}" alt="Preview design neon test" style="display:block;width:100%;height:auto;margin:0 0 20px;border-radius:12px;background:#11131a" />
    <table role="presentation" style="width:100%;border-collapse:collapse">
      ${detailRow('Rujukan test', design.reference)}
      ${detailRow('Teks neon', design.text)}
      ${detailRow('Saiz tulisan', design.textSize)}
      ${detailRow('Saiz backboard', design.backboardSize)}
      ${detailRow('Harga anggaran', displayMoney(design.estimatedPrice))}
      ${detailRow('Link Cloudinary', design.previewUrl)}
    </table>
    ${layerRows}`;
  return {
    subject: `[TEST] Preview Design Neon · ${design.reference}`,
    html: emailShell({
      eyebrow: 'Vercel Preview · Cloudinary Test',
      title: 'Snapshot design berjaya dihantar',
      intro: 'Semak sama ada gambar, susunan dan ukuran sepadan dengan configurator.',
      content,
      footer: 'Email test sahaja. Website production, Supabase live dan ToyyibPay tidak disentuh.',
    }),
  };
}

export function buildCustomerOrderEmail(order) {
  const subject = `Bayaran diterima — Tempahan ${order.reference}`;
  const isDeposit = order.package_tier === 'custom';
  const content = `
    <div style="margin-bottom:18px;padding:14px 16px;border-left:4px solid #36b96b;background:#edf9f1;color:#176635;font-size:13px;font-weight:800">Bayaran ${displayMoney(order.amount)} telah berjaya diterima.</div>
    ${designPreviewBlock(order)}
    <table role="presentation" style="width:100%;border-collapse:collapse">
      ${detailRow('Rujukan tempahan', order.reference)}
      ${detailRow('Teks neon', order.neon_text || 'Design Custom')}
      ${detailRow('Font', order.font_name)}
      ${detailRow('Warna', getColorSummary(order))}
      ${detailRow('Pakej', order.package_name)}
      ${detailRow(isDeposit ? 'Deposit dibayar' : 'Jumlah dibayar', displayMoney(order.amount))}
      ${order.estimated_price ? detailRow('Anggaran harga penuh', displayMoney(order.estimated_price)) : ''}
    </table>
    ${designLayerTable(order)}
    <p style="margin:20px 0 8px;color:#171411;font-size:14px;font-weight:800">Apa yang berlaku selepas ini?</p>
    <p style="margin:0;color:#625b53;font-size:13px;line-height:1.7">Designer kami akan menghubungi tuan/puan melalui WhatsApp untuk mengesahkan teks, font, warna dan mockup sebelum pengeluaran bermula.</p>
    <div style="margin-top:18px;padding:16px;border:1px solid #dfe9e2;border-radius:12px;background:#f4fbf6">
      <p style="margin:0 0 12px;color:#31533d;font-size:13px;line-height:1.65">Hubungi kami melalui WhatsApp untuk mengetahui status tempahan atau berbincang dengan designer kami jika anda mahu membuat perubahan pada design.</p>
      <a href="https://www.wasap.my/601169530763" style="display:inline-block;padding:11px 16px;border-radius:8px;background:#1fa855;color:#ffffff;font-size:13px;font-weight:800;text-decoration:none">WhatsApp Team pakarneonled.store</a>
    </div>`;

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

export function buildCustomerPendingEmail(order) {
  const subject = `Tempahan diterima — Bayaran belum selesai · ${order.reference}`;
  const paymentLink = String(order.payment_url || '').trim();
  const content = `
    <div style="margin-bottom:18px;padding:14px 16px;border-left:4px solid #e3a008;background:#fff8e6;color:#7a5200;font-size:13px;font-weight:800">Tempahan anda telah diterima, tetapi bayaran masih belum selesai.</div>
    ${designPreviewBlock(order)}
    <table role="presentation" style="width:100%;border-collapse:collapse">
      ${detailRow('Rujukan tempahan', order.reference)}
      ${detailRow('Teks neon', order.neon_text || 'Design Custom')}
      ${detailRow('Font', order.font_name)}
      ${detailRow('Warna', getColorSummary(order))}
      ${detailRow('Pakej', order.package_name)}
      ${detailRow('Jumlah bayaran', displayMoney(order.amount))}
      ${order.estimated_price ? detailRow('Anggaran harga penuh', displayMoney(order.estimated_price)) : ''}
    </table>
    ${designLayerTable(order)}
    ${paymentLink ? `<div style="margin-top:20px"><a href="${escapeHtml(paymentLink)}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#ff5b51;color:#ffffff;font-size:13px;font-weight:800;text-decoration:none">Sambung Pembayaran</a></div>` : ''}
    <div style="margin-top:18px;padding:16px;border:1px solid #dfe9e2;border-radius:12px;background:#f4fbf6">
      <p style="margin:0 0 12px;color:#31533d;font-size:13px;line-height:1.65">Jika anda menghadapi masalah pembayaran atau mahu berbincang tentang perubahan design, hubungi team kami melalui WhatsApp.</p>
      <a href="https://www.wasap.my/601169530763" style="display:inline-block;padding:11px 16px;border-radius:8px;background:#1fa855;color:#ffffff;font-size:13px;font-weight:800;text-decoration:none">WhatsApp Team pakarneonled.store</a>
    </div>`;

  return {
    subject,
    html: emailShell({
      eyebrow: 'Pakar LED & Neon by YH',
      title: `Tempahan diterima, ${order.customer_name || 'tuan/puan'}`,
      intro: 'Kami sudah menerima butiran rekaan anda. Lengkapkan pembayaran untuk meneruskan tempahan.',
      content,
      footer: 'Jika anda sudah membuat bayaran, abaikan peringatan ini. Email pengesahan bayaran akan dihantar selepas transaksi disahkan oleh ToyyibPay.',
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

export function sendOwnerPendingEmail(order) {
  const ownerEmail = process.env.ORDER_NOTIFICATION_EMAIL;
  if (!ownerEmail) throw new Error('Email penerima notifikasi belum ditetapkan.');
  const email = buildOwnerPendingEmail(order);
  return sendResendEmail({
    to: ownerEmail,
    replyTo: order.customer_email || undefined,
    ...email,
    idempotencyKey: `pending-owner/${order.reference}`,
  });
}

export function sendTestDesignEmail(design) {
  const ownerEmail = process.env.ORDER_NOTIFICATION_EMAIL;
  if (!ownerEmail) throw new Error('Email penerima notifikasi belum ditetapkan.');
  const email = buildTestDesignEmail(design);
  return sendResendEmail({
    to: ownerEmail,
    ...email,
    idempotencyKey: `test-design/${design.reference}`,
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

export function sendCustomerPendingEmail(order) {
  if (!order.customer_email) return null;
  const ownerEmail = process.env.ORDER_NOTIFICATION_EMAIL;
  const email = buildCustomerPendingEmail(order);
  return sendResendEmail({
    to: order.customer_email,
    replyTo: ownerEmail || undefined,
    ...email,
    idempotencyKey: `pending-customer/${order.reference}`,
  });
}
