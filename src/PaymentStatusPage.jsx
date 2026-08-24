import { useEffect, useState } from 'react';

const STATUS_CONTENT = {
  checking: { eyebrow: 'Menyemak pembayaran', title: 'Tunggu sebentar', copy: 'Kami sedang mendapatkan pengesahan transaksi terus daripada ToyyibPay.' },
  success: { eyebrow: 'Pembayaran berjaya', title: 'Tempahan diterima', copy: 'Terima kasih. Designer kami akan menghubungi anda melalui WhatsApp untuk mengesahkan rekaan dan butiran tempahan.' },
  pending: { eyebrow: 'Pembayaran sedang diproses', title: 'Status masih pending', copy: 'Pihak bank atau ToyyibPay masih memproses transaksi. Jangan buat bayaran kali kedua. Semak semula sebentar lagi.' },
  failed: { eyebrow: 'Pembayaran tidak berjaya', title: 'Cuba sekali lagi', copy: 'Tiada bayaran berjaya direkodkan. Anda boleh kembali ke checkout dan cuba semula menggunakan pilihan bank yang lain.' },
  unknown: { eyebrow: 'Pengesahan belum tersedia', title: 'Kami akan semak', copy: 'Status transaksi belum dapat disahkan. Simpan rujukan anda dan pihak kami akan mengesahkannya melalui WhatsApp.' },
};

export function PaymentStatusPage() {
  const query = new URLSearchParams(window.location.search);
  const billCode = query.get('billcode') || '';
  const orderId = query.get('order_id') || '';
  const [status, setStatus] = useState('checking');
  const [details, setDetails] = useState({ reference: orderId, billCode });

  useEffect(() => {
    if (!billCode) {
      setStatus('unknown');
      return undefined;
    }
    let active = true;
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/payment-status?${new URLSearchParams({ billcode: billCode, order_id: orderId })}`, { cache: 'no-store' });
        const result = await response.json();
        if (!active) return;
        if (!response.ok) throw new Error(result.error);
        setDetails(result);
        setStatus(result.status || 'unknown');
      } catch {
        if (active) setStatus('unknown');
      }
    };
    checkStatus();
    return () => { active = false; };
  }, [billCode, orderId]);

  const content = STATUS_CONTENT[status] || STATUS_CONTENT.unknown;
  return <main className={`payment-status-page payment-${status}`}>
    <a className="checkout-brand" href="/">PAKAR LED &amp; NEON <i>BY YH</i></a>
    <section className="payment-status-card" aria-live="polite">
      <div className="payment-status-mark" aria-hidden="true">{status === 'success' ? '✓' : status === 'failed' ? '×' : status === 'checking' ? '···' : '!'}</div>
      <p className="checkout-kicker">{content.eyebrow}</p>
      <h1>{content.title}</h1>
      <p>{content.copy}</p>
      {(details.reference || details.billCode) && <dl>
        {details.reference && <div><dt>Rujukan</dt><dd>{details.reference}</dd></div>}
        {details.billCode && <div><dt>Bill Code</dt><dd>{details.billCode}</dd></div>}
        {details.amount && <div><dt>Jumlah</dt><dd>RM{details.amount}</dd></div>}
        {details.invoice && <div><dt>Invois ToyyibPay</dt><dd>{details.invoice}</dd></div>}
      </dl>}
      <div className="payment-status-actions">
        {status === 'failed' && <a className="checkout-pay" href="/checkout">Cuba Bayar Semula <span>→</span></a>}
        {status === 'pending' && <button className="checkout-pay" type="button" onClick={() => window.location.reload()}>Semak Status Lagi <span>↻</span></button>}
        <a className="checkout-back" href="/">Kembali ke laman utama</a>
      </div>
    </section>
  </main>;
}

