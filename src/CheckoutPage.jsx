import { useEffect, useRef, useState } from 'react';
import { tokenizeNeonText, useFittedNeonText } from './neonText';
import { trackMetaEventOnce } from './metaPixel';
import { createDisplayReference } from './orderReference';

const ORDER_KEY = 'yh-neon-checkout-order';
const CUSTOMER_KEY = 'yh-neon-checkout-customer';
const checkoutSlides = [
  { src: '/assets/contoh-hasil/michael-jackson-neon.jpg', alt: 'Hasil sebenar neon nama Michael Jackson' },
  { src: '/assets/contoh-hasil/haikal-feroz-neon.jpg', alt: 'Hasil sebenar neon nama Haikal Feroz' },
  { src: '/assets/contoh-hasil/1.jpeg', alt: 'Contoh hasil neon LED untuk event' },
  { src: '/assets/contoh-hasil/2.png', alt: 'Contoh hasil neon LED pelanggan 2' },
  { src: '/assets/contoh-hasil/3.jpg', alt: 'Contoh hasil neon LED pelanggan 3' },
  { src: '/assets/contoh-hasil/TERATAK POKOK RHU.jpg', alt: 'Neon Teratak Pokok Rhu' },
  { src: '/assets/contoh-hasil/WhatsApp Image 2024-09-16 at 13.23.55_18c51137.jpg', alt: 'Contoh hasil neon LED pelanggan' },
  { src: '/assets/contoh-hasil/WAK IKHSAN KEBAB.jpg', alt: 'Neon Wak Ikhsan Kebab' },
];

const readStoredOrder = () => {
  try {
    return JSON.parse(window.sessionStorage.getItem(ORDER_KEY));
  } catch {
    return null;
  }
};

export function CheckoutPage() {
  const [order] = useState(readStoredOrder);
  const [displayReference] = useState(() => order?.displayReference || createDisplayReference());
  const orderNeonRef = useRef(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCheckoutSlide, setActiveCheckoutSlide] = useState(0);
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
  const checkoutText = order?.text || 'Design Custom';
  const estimatedDimensions = order?.tier === 'basic'
    ? { length: '≤60cm' }
    : order?.tier === 'plus'
      ? { length: '≤85cm' }
      : null;
  const checkoutTokens = tokenizeNeonText(checkoutText);
  const isMultiColor = order?.colorMode === 'multi' && order?.wordColors?.length;
  const checkoutWordColors = new Map((order?.wordColors || []).map((item) => [item.wordIndex, item]));
  const checkoutFontSize = useFittedNeonText(orderNeonRef, checkoutText, order?.fontFamily || 'Manrope Variable', { maxSize: 82 });

  useEffect(() => {
    if (!order?.fontName || !order?.fontFamily) return undefined;
    const selectedFont = new FontFace(order.fontFamily, `url(/fonts/${order.fontName}.ttf)`);
    let active = true;
    selectedFont.load().then((loadedFont) => {
      if (active) document.fonts.add(loadedFont);
    }).catch(() => {});
    return () => { active = false; };
  }, [order]);

  useEffect(() => {
    if (!order) return;
    trackMetaEventOnce(`initiate-checkout:${order.reference}`, 'InitiateCheckout', {
      content_name: order.packageName,
      content_ids: [order.tier],
      content_type: 'product',
      currency: 'MYR',
      value: Number(order.price || 0),
      num_items: 1,
    });
  }, [order]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setActiveCheckoutSlide((current) => (current + 1) % checkoutSlides.length), 3800);
    return () => window.clearInterval(timer);
  }, []);

  if (!order) {
    return <main className="checkout-page checkout-empty">
      <a className="checkout-brand" href="/">PAKAR LED &amp; NEON <i>BY YH</i></a>
      <section><span>Tempahan tidak dijumpai</span><h1>Reka neon anda dahulu.</h1><p>Pilihan configurator diperlukan sebelum checkout boleh diteruskan.</p><a className="checkout-back" href="/#playground">← Kembali ke configurator</a></section>
    </main>;
  }

  const updateField = (event) => setCustomer((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submitOrder = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    window.sessionStorage.setItem(CUSTOMER_KEY, JSON.stringify({ ...customer, orderReference: order.reference }));
    try {
      const paymentResponse = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order, customer }),
      });
      const result = await paymentResponse.json();
      if (!paymentResponse.ok || !result.paymentUrl) throw new Error(result.error || 'Bil pembayaran tidak dapat dicipta.');
      window.sessionStorage.setItem('yh-neon-payment', JSON.stringify({
        billCode: result.billCode,
        reference: result.reference,
        amount: result.amount,
      }));
      trackMetaEventOnce(`add-payment-info:${result.reference}`, 'AddPaymentInfo', {
        content_name: order.packageName,
        content_ids: [result.tier || order.tier],
        content_type: 'product',
        currency: 'MYR',
        value: Number(result.amount || order.price || 0),
      });
      await new Promise((resolve) => window.setTimeout(resolve, 150));
      window.location.assign(result.paymentUrl);
    } catch (paymentError) {
      setError(paymentError.message || 'Sambungan pembayaran gagal. Sila cuba lagi.');
      setIsSubmitting(false);
    }
  };

  return <main className="checkout-page">
    <header className="checkout-header"><a className="checkout-brand" href="/">PAKAR LED &amp; NEON <i>BY YH</i></a><div><span>Checkout selamat</span><strong>Semak sebelum bayar</strong></div></header>
    <section className="checkout-slideshow" aria-label="Slideshow hasil neon sebenar">
      {checkoutSlides.map((slide, index) => <img key={slide.src} className={activeCheckoutSlide === index ? 'active' : ''} src={slide.src} alt={slide.alt} aria-hidden={activeCheckoutSlide !== index} loading={index === 0 ? 'eager' : 'lazy'} />)}
      <div className="checkout-slide-label"><span>Hasil sebenar pelanggan</span><strong>{String(activeCheckoutSlide + 1).padStart(2, '0')} / {String(checkoutSlides.length).padStart(2, '0')}</strong></div>
    </section>
    <div className="checkout-layout">
      <form className="checkout-form" onSubmit={submitOrder}>
        <a className="checkout-back checkout-back-prominent" href="/#playground">← Kembali ke configurator</a>
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
        <div className="checkout-important"><strong>Maklumat penting</strong><p>Selepas pembayaran dibuat, designer akan menghubungi tuan/puan melalui WhatsApp untuk pengesahan tempahan.</p></div>
        {error && <p className="checkout-error" role="alert">{error}</p>}
        <button className="checkout-pay" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Menyediakan bil selamat...' : 'Teruskan ke Pembayaran'} <span>{isSubmitting ? '···' : '→'}</span></button>
        <p className="checkout-privacy">Maklumat alamat disimpan sementara dalam sesi browser ini. Sambungan backend diperlukan sebelum menerima tempahan pelanggan sebenar.</p>
      </form>

      <aside className="order-review">
        <p className="checkout-kicker">02 / Semak tempahan</p>
        <div className="order-neon" ref={orderNeonRef} style={{ '--checkout-neon': order.colorValue, '--checkout-glow': order.colorGlow, fontFamily: order.fontFamily }}>
          <div className={`order-neon-text ${isMultiColor ? 'multi-color' : ''}`} data-text={isMultiColor ? undefined : checkoutText} style={{ fontSize: `${checkoutFontSize}px` }}>
            {isMultiColor ? checkoutTokens.map((token, index) => {
              if (token.type === 'space') return token.value;
              const wordColor = checkoutWordColors.get(token.wordIndex) || { value: order.colorValue, glow: order.colorGlow };
              return <span className="checkout-neon-word" key={`${token.value}-${index}`} data-text={token.value} style={{ '--checkout-neon': wordColor.value, '--checkout-glow': wordColor.glow }}>{token.value}</span>;
            }) : checkoutText}
          </div>
        </div>
        <dl>
          <div><dt>Rujukan</dt><dd>{displayReference}</dd></div>
          <div><dt>Pakej</dt><dd>{order.packageName}</dd></div>
          {order.text && <div><dt>Teks neon</dt><dd>{order.text}</dd></div>}
          {order.fontName && <div><dt>Font</dt><dd>{order.fontName}</dd></div>}
          {order.colorLabel && <div><dt>Warna</dt><dd>{isMultiColor ? [...new Set(order.wordColors.map((item) => item.label))].join(', ') : order.colorLabel}</dd></div>}
          <div><dt>Saiz</dt>{estimatedDimensions
            ? <dd>{estimatedDimensions.length}</dd>
            : <dd>Saiz akan disahkan selepas design dibincangkan</dd>}</div>
          {order.estimatedPrice && <div><dt>Anggaran harga penuh</dt><dd>RM{order.estimatedPrice}*</dd></div>}
        </dl>
        <div className="order-total"><span>{order.tier === 'custom' ? 'Deposit dibayar sekarang' : 'Total'}</span><div className="order-total-price"><strong>RM{order.price}</strong><small>QR PAY disediakan di halaman sebelah</small></div></div>
        {order.estimatedPrice && <p className="estimate-note">*Anggaran berdasarkan jumlah huruf. Deposit RM100 ialah tanda komitmen tempahan. Kami akan menghubungi anda melalui WhatsApp dan deposit ditolak daripada harga akhir.</p>}
      </aside>
    </div>
  </main>;
}
