import { useEffect, useRef, useState } from 'react';
import { tokenizeNeonText, useFittedNeonText } from './neonText';
import { trackMetaEventOnce } from './metaPixel';
import { createDisplayReference } from './orderReference';

const ORDER_KEY = 'yh-neon-checkout-order';
const CUSTOMER_KEY = 'yh-neon-checkout-customer';
const SHIPPING_VOUCHER_KEY = 'yh-neon-shipping-voucher';
const SHIPPING_VOUCHER_SESSION_KEY = 'yh-neon-shipping-voucher-session';
const VOUCHER_DURATION_MINUTES = 10;
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

const readStoredVoucher = () => {
  try {
    const voucher = JSON.parse(window.sessionStorage.getItem(SHIPPING_VOUCHER_KEY));
    if (import.meta.env.DEV && voucher?.id === 'local-preview' && voucher?.claimedAt) {
      return {
        ...voucher,
        expiresAt: new Date(new Date(voucher.claimedAt).getTime() + (VOUCHER_DURATION_MINUTES * 60 * 1000)).toISOString(),
        warrantyMonths: 6,
      };
    }
    return voucher;
  } catch {
    return null;
  }
};

const formatCountdown = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export function CheckoutPage() {
  const [order] = useState(readStoredOrder);
  const [displayReference] = useState(() => order?.displayReference || createDisplayReference());
  const orderNeonRef = useRef(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCheckoutSlide, setActiveCheckoutSlide] = useState(0);
  const [showShippingVoucher, setShowShippingVoucher] = useState(false);
  const [shippingVoucher, setShippingVoucher] = useState(readStoredVoucher);
  const [isClaimingVoucher, setIsClaimingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [voucherNow, setVoucherNow] = useState(Date.now());
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
  const voucherSecondsLeft = Math.max(0, Math.ceil((new Date(shippingVoucher?.expiresAt || 0).getTime() - voucherNow) / 1000));
  const hasActiveShippingVoucher = Boolean(shippingVoucher?.claimSession && voucherSecondsLeft > 0);

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

  useEffect(() => {
    if (shippingVoucher?.claimSession) return undefined;
    const timer = window.setTimeout(() => setShowShippingVoucher(true), 4000);
    return () => window.clearTimeout(timer);
  }, [shippingVoucher]);

  useEffect(() => {
    if (!shippingVoucher?.expiresAt) return undefined;
    const timer = window.setInterval(() => setVoucherNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [shippingVoucher]);

  if (!order) {
    return <main className="checkout-page checkout-empty">
      <a className="checkout-brand" href="/">PAKAR LED &amp; NEON <i>BY YH</i></a>
      <section><span>Tempahan tidak dijumpai</span><h1>Reka neon anda dahulu.</h1><p>Pilihan configurator diperlukan sebelum checkout boleh diteruskan.</p><a className="checkout-back" href="/#playground">← Kembali ke configurator</a></section>
    </main>;
  }

  const updateField = (event) => setCustomer((current) => ({ ...current, [event.target.name]: event.target.value }));
  const claimShippingVoucher = async () => {
    if (isClaimingVoucher) return;
    setVoucherError('');
    setIsClaimingVoucher(true);
    let claimSession = window.sessionStorage.getItem(SHIPPING_VOUCHER_SESSION_KEY);
    if (!claimSession) {
      claimSession = window.crypto?.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
        const randomValue = Math.floor(Math.random() * 16);
        return (character === 'x' ? randomValue : (randomValue & 0x3) | 0x8).toString(16);
      });
      window.sessionStorage.setItem(SHIPPING_VOUCHER_SESSION_KEY, claimSession);
    }
    try {
      let result;
      if (import.meta.env.DEV && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
        const claimedAt = new Date();
        result = { id: 'local-preview', claimSession, claimedAt: claimedAt.toISOString(), expiresAt: new Date(claimedAt.getTime() + (VOUCHER_DURATION_MINUTES * 60 * 1000)).toISOString(), shippingValue: 20, warrantyMonths: 6, active: true };
      } else {
        const claimResponse = await fetch('/api/claim-shipping-voucher', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ claimSession }),
        });
        result = await claimResponse.json();
        if (!claimResponse.ok || !result.active) throw new Error(result.error || 'Voucher tidak dapat diclaim.');
      }
      const claimedVoucher = { ...result, claimSession };
      window.sessionStorage.setItem(SHIPPING_VOUCHER_KEY, JSON.stringify(claimedVoucher));
      setShippingVoucher(claimedVoucher);
      setVoucherNow(Date.now());
    } catch (claimError) {
      setVoucherError(claimError.message || 'Voucher tidak dapat diclaim sekarang.');
    } finally {
      setIsClaimingVoucher(false);
    }
  };
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
        body: JSON.stringify({ order, customer, shippingVoucherClaim: hasActiveShippingVoucher ? shippingVoucher.claimSession : '' }),
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
    <div className="checkout-urgency" role="status" aria-label="Tempahan diproses mengikut giliran bayaran. Claim tawaran 10 minit untuk Free Shipping RM20 dan warranty 6 bulan.">
      <div className="checkout-urgency-track" aria-hidden="true">
        <span>Tempahan diproses mengikut giliran bayaran <b>•</b> Claim dalam 10 minit: Free Shipping RM20 + Warranty 6 Bulan <b>•</b></span>
        <span>Tempahan diproses mengikut giliran bayaran <b>•</b> Claim dalam 10 minit: Free Shipping RM20 + Warranty 6 Bulan <b>•</b></span>
      </div>
    </div>
    <nav className="checkout-progress" aria-label="Kemajuan checkout">
      <a className="checkout-progress-step complete" href="/#playground"><span>✓</span><strong>Configurator</strong></a>
      <div className="checkout-progress-step active" aria-current="step"><span>2</span><strong>Pengesahan</strong></div>
      <div className="checkout-progress-step"><span>3</span><strong>Bayaran</strong></div>
    </nav>
    {showShippingVoucher && <div className="shipping-voucher-overlay" role="dialog" aria-modal="true" aria-labelledby="shipping-voucher-title">
      <section className="shipping-voucher-modal">
        <button className="shipping-voucher-close" type="button" onClick={() => setShowShippingVoucher(false)} aria-label="Tutup popup voucher">×</button>
        {hasActiveShippingVoucher ? <>
          <span className="shipping-voucher-gift">✓</span>
          <p className="checkout-kicker">Voucher berjaya diclaim</p>
          <h2 id="shipping-voucher-title">Free Shipping + Warranty 6 Bulan</h2>
          <p>Selesaikan checkout dalam masa 10 minit untuk gunakan kedua-dua manfaat ini.</p>
          <strong className="shipping-voucher-countdown">{formatCountdown(voucherSecondsLeft)}</strong>
          <button className="shipping-voucher-claim" type="button" onClick={() => setShowShippingVoucher(false)}>Teruskan Checkout</button>
        </> : shippingVoucher?.expiresAt ? <>
          <span className="shipping-voucher-gift">!</span>
          <p className="checkout-kicker">Masa telah tamat</p>
          <h2 id="shipping-voucher-title">Voucher Tamat</h2>
          <p>Teruskan tempahan dengan penghantaran biasa RM20 dan warranty standard 3 bulan.</p>
          <button className="shipping-voucher-claim secondary" type="button" onClick={() => setShowShippingVoucher(false)}>Teruskan Checkout</button>
        </> : <>
          <span className="shipping-voucher-gift">🎁</span>
          <p className="checkout-kicker">Berita baik!</p>
          <h2 id="shipping-voucher-title">Hadiah Untuk Tempahan Anda</h2>
          <p>Claim sekarang untuk dapat <strong>FREE SHIPPING RM20</strong> dan warranty dilanjutkan daripada <strong>3 bulan kepada 6 bulan</strong>. Selepas claim, tawaran sah selama 10 minit.</p>
          {voucherError && <p className="checkout-error" role="alert">{voucherError}</p>}
          <button className="shipping-voucher-claim" type="button" onClick={claimShippingVoucher} disabled={isClaimingVoucher}>{isClaimingVoucher ? 'Sedang claim...' : 'Claim Free Shipping + Warranty 6 Bulan'}</button>
        </>}
      </section>
    </div>}
    <div className="checkout-layout">
      <form className="checkout-form checkout-card" onSubmit={submitOrder}>
        <a className="checkout-back checkout-back-prominent" href="/#playground">← Kembali ke configurator</a>
        <p className="checkout-kicker">Langkah 2 daripada 3</p>
        <h1>Sahkan tempahan</h1>
        <p className="checkout-lead">Lengkapkan maklumat di bawah dan semak ringkasan pesanan sebelum membuat bayaran.</p>
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
        <label className="checkout-consent"><input type="checkbox" required /> <span>Saya sudah menyemak maklumat pelanggan, teks, font, warna dan jumlah bayaran.</span></label>
        <div className="checkout-important"><strong>Selepas bayaran</strong><p>Designer akan menghubungi anda melalui WhatsApp untuk pengesahan tempahan.</p></div>
        {error && <p className="checkout-error" role="alert">{error}</p>}
        <button className="checkout-pay" type="submit" disabled={isSubmitting}>
          <span className="checkout-pay-copy">
            <strong>{isSubmitting ? 'Menyediakan halaman bayaran...' : 'Tempah Untuk Slot Sekarang!'}</strong>
            {hasActiveShippingVoucher && !isSubmitting && <small>Free Shipping + Warranty 6 Bulan · {formatCountdown(voucherSecondsLeft)}</small>}
          </span>
          <span aria-hidden="true">{isSubmitting ? '···' : '→'}</span>
        </button>
        <p className="checkout-payment-note">Langkah seterusnya: pilih FPX atau QR Pay di halaman pembayaran.</p>
        <p className="checkout-privacy">Maklumat anda digunakan untuk urusan tempahan dan penghantaran sahaja.</p>
      </form>

      <aside className="order-review">
        <p className="checkout-kicker">Ringkasan pesanan</p>
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
          <div className="shipping-summary"><dt>Penghantaran</dt><dd>{hasActiveShippingVoucher ? <><s>RM20</s><strong>PERCUMA</strong><small>Voucher tamat dalam {formatCountdown(voucherSecondsLeft)}</small></> : <>RM20<small>Dibayar apabila barang dihantar</small></>}</dd></div>
          <div className="warranty-summary"><dt>Warranty</dt><dd>{hasActiveShippingVoucher ? <><s>3 bulan</s><strong>6 BULAN</strong><small>Dengan voucher aktif</small></> : <>3 bulan<small>Warranty standard</small></>}</dd></div>
        </dl>
        <div className="order-total"><span>{order.tier === 'custom' ? 'Deposit dibayar sekarang' : 'Total'}</span><div className="order-total-price"><strong>RM{order.price}</strong><small>QR PAY disediakan di halaman sebelah</small></div></div>
        {order.estimatedPrice && <p className="estimate-note">*Anggaran berdasarkan jumlah huruf. Deposit RM100 ialah tanda komitmen tempahan. Kami akan menghubungi anda melalui WhatsApp dan deposit ditolak daripada harga akhir.</p>}
      </aside>
    </div>
    <section className="checkout-proof" aria-label="Slideshow hasil neon sebenar">
      <div className="checkout-proof-copy"><p className="checkout-kicker">Hasil sebenar pelanggan</p><strong>Direka, disahkan dan dihasilkan oleh kami.</strong></div>
      <div className="checkout-slideshow">
        {checkoutSlides.map((slide, index) => <img key={slide.src} className={activeCheckoutSlide === index ? 'active' : ''} src={slide.src} alt={slide.alt} aria-hidden={activeCheckoutSlide !== index} loading={index === 0 ? 'eager' : 'lazy'} />)}
        <div className="checkout-slide-label"><span>Hasil sebenar pelanggan</span><strong>{String(activeCheckoutSlide + 1).padStart(2, '0')} / {String(checkoutSlides.length).padStart(2, '0')}</strong></div>
      </div>
    </section>
  </main>;
}
