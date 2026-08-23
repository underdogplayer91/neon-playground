import { useMemo, useState } from 'react';
import { PAYMENT_LINKS } from './siteConfig';

const ORDER_KEY = 'yh-neon-checkout-order';
const CUSTOMER_KEY = 'yh-neon-checkout-customer';

const readStoredOrder = () => {
  try {
    return JSON.parse(window.sessionStorage.getItem(ORDER_KEY));
  } catch {
    return null;
  }
};

const buildGatewayUrl = (paymentLink, order, customer) => {
  const separator = paymentLink.includes('?') ? '&' : '?';
  const params = new URLSearchParams({
    rujukan: order.reference,
    pakej: order.packageName,
    harga: `RM${order.price}`,
    nama: customer.name,
    telefon: customer.phone,
    email: customer.email || '',
  });
  return `${paymentLink}${separator}${params.toString()}`;
};

export function CheckoutPage() {
  const [order] = useState(readStoredOrder);
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address1: '',
    address2: '',
    postcode: '',
    city: '',
    state: '',
  });
  const paymentLink = useMemo(() => order ? PAYMENT_LINKS[order.tier]?.trim() : '', [order]);

  if (!order) {
    return <main className="checkout-page checkout-empty">
      <a className="checkout-brand" href="/">PAKAR LED &amp; NEON <i>BY YH</i></a>
      <section><span>Tempahan tidak dijumpai</span><h1>Reka neon anda dahulu.</h1><p>Pilihan configurator diperlukan sebelum checkout boleh diteruskan.</p><a className="checkout-back" href="/#playground">← Kembali ke configurator</a></section>
    </main>;
  }

  const updateField = (event) => setCustomer((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submitOrder = (event) => {
    event.preventDefault();
    window.sessionStorage.setItem(CUSTOMER_KEY, JSON.stringify({ ...customer, orderReference: order.reference }));
    if (!paymentLink) {
      setError('Payment gateway belum disambungkan. Isi link pakej ini dalam src/siteConfig.js untuk meneruskan bayaran.');
      return;
    }
    window.location.assign(buildGatewayUrl(paymentLink, order, customer));
  };

  return <main className="checkout-page">
    <header className="checkout-header"><a className="checkout-brand" href="/">PAKAR LED &amp; NEON <i>BY YH</i></a><div><span>Checkout selamat</span><strong>Semak sebelum bayar</strong></div></header>
    <div className="checkout-layout">
      <form className="checkout-form" onSubmit={submitOrder}>
        <a className="checkout-back" href="/#playground">← Kembali ke configurator</a>
        <p className="checkout-kicker">01 / Maklumat pelanggan</p>
        <h1>Lengkapkan<br /><em>tempahan anda.</em></h1>
        <div className="checkout-fields">
          <label className="field-wide">Nama penuh<input name="name" value={customer.name} onChange={updateField} autoComplete="name" required /></label>
          <label>Nombor telefon<input name="phone" value={customer.phone} onChange={updateField} inputMode="tel" autoComplete="tel" placeholder="01X-XXXXXXX" required /></label>
          <label>Email <small>(pilihan)</small><input name="email" type="email" value={customer.email} onChange={updateField} autoComplete="email" /></label>
          <label className="field-wide">Alamat penghantaran<input name="address1" value={customer.address1} onChange={updateField} autoComplete="address-line1" placeholder="No. rumah, jalan dan kawasan" required /></label>
          <label className="field-wide">Alamat tambahan <small>(pilihan)</small><input name="address2" value={customer.address2} onChange={updateField} autoComplete="address-line2" /></label>
          <label>Poskod<input name="postcode" value={customer.postcode} onChange={updateField} inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{5}" maxLength="5" required /></label>
          <label>Bandar<input name="city" value={customer.city} onChange={updateField} autoComplete="address-level2" required /></label>
          <label className="field-wide">Negeri<select name="state" value={customer.state} onChange={updateField} autoComplete="address-level1" required><option value="">Pilih negeri</option>{['Johor','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang','Perak','Perlis','Pulau Pinang','Sabah','Sarawak','Selangor','Terengganu','Kuala Lumpur','Labuan','Putrajaya'].map((state) => <option key={state}>{state}</option>)}</select></label>
        </div>
        <label className="checkout-consent"><input type="checkbox" required /> <span>Saya sudah menyemak teks, font, warna dan alamat penghantaran.</span></label>
        {error && <p className="checkout-error" role="alert">{error}</p>}
        <button className="checkout-pay" type="submit">Teruskan ke Pembayaran <span>→</span></button>
        <p className="checkout-privacy">Maklumat alamat disimpan sementara dalam sesi browser ini. Sambungan backend diperlukan sebelum menerima tempahan pelanggan sebenar.</p>
      </form>

      <aside className="order-review">
        <p className="checkout-kicker">02 / Semak tempahan</p>
        <div className="order-neon" style={{ '--checkout-neon': order.colorValue, '--checkout-glow': order.colorGlow, fontFamily: order.fontFamily }}><span>{order.text || 'Design Custom'}</span></div>
        <dl>
          <div><dt>Rujukan</dt><dd>{order.reference}</dd></div>
          <div><dt>Pakej</dt><dd>{order.packageName}</dd></div>
          {order.text && <div><dt>Teks neon</dt><dd>{order.text}</dd></div>}
          {order.text && <div><dt>Jumlah huruf</dt><dd>{order.characterCount}</dd></div>}
          {order.fontName && <div><dt>Font</dt><dd>{order.fontName}</dd></div>}
          {order.colorLabel && <div><dt>Warna</dt><dd>{order.colorLabel}</dd></div>}
          <div><dt>Saiz</dt><dd>{order.sizeNote}</dd></div>
        </dl>
        <div className="order-total"><span>{order.tier === 'custom' ? 'Deposit design' : 'Jumlah produk'}</span><strong>RM{order.price}</strong></div>
        <p className="shipping-note">Caj penghantaran belum termasuk dan memerlukan kadar sebenar sebelum checkout diterbitkan.</p>
      </aside>
    </div>
  </main>;
}
