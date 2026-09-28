import { useEffect, useRef, useState } from 'react';
import { tokenizeNeonText, useFittedNeonText } from './neonText';
import { trackMetaEventOnce } from './metaPixel';
import { toJpeg } from 'html-to-image';
import { sizingFonts } from './neonSizing';

const ORDER_KEY = 'yh-neon-checkout-order';
const CUSTOMER_KEY = 'yh-neon-checkout-customer';
const EMAIL_CAPTURE_WIDTH = 1200;
const EMAIL_CAPTURE_HEIGHT = 523;
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

function OrderDesignPreview({ snapshot, fallback }) {
  if (!snapshot?.layers?.length) return fallback;
  const safePaddingX = Math.max(3, snapshot.backboardWidthCm * 0.05);
  const safePaddingY = Math.max(4, snapshot.backboardHeightCm * 0.14);
  const viewBox = `${snapshot.boardOriginX - safePaddingX} ${snapshot.boardOriginY - safePaddingY} ${snapshot.backboardWidthCm + (safePaddingX * 2)} ${snapshot.backboardHeightCm + (safePaddingY * 2)}`;
  return <svg className="checkout-design-svg" viewBox={viewBox} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Preview design neon yang dipilih">
    {(snapshot.layers || []).map((layer) => {
      const centerX = layer.x_cm + layer.width_cm / 2;
      const centerY = layer.y_cm + layer.target_height_cm / 2;
      return <g key={layer.id} transform={`rotate(${Number(layer.rotation_deg) || 0} ${centerX} ${centerY})`}>
        <foreignObject x={layer.x_cm} y={layer.y_cm} width={layer.width_cm} height={layer.target_height_cm} overflow="visible">
          <div xmlns="http://www.w3.org/1999/xhtml" className="canvas-neon-word neon-word checkout-design-word" data-text={layer.text} style={{ '--neon': layer.colorValue, '--glow': layer.colorGlow, fontFamily: layer.fontFamily, fontSize: `${layer.target_height_cm}px`, letterSpacing: `${layer.letter_spacing_cm}px` }}>{layer.text}</div>
        </foreignObject>
      </g>;
    })}
  </svg>;
}

function EmailDesignCapture({ snapshot, fallback }) {
  if (!snapshot?.layers?.length) return fallback;
  const safePaddingX = Math.max(3, snapshot.backboardWidthCm * 0.05);
  const safePaddingY = Math.max(4, snapshot.backboardHeightCm * 0.14);
  const viewX = snapshot.boardOriginX - safePaddingX;
  const viewY = snapshot.boardOriginY - safePaddingY;
  const viewWidth = snapshot.backboardWidthCm + (safePaddingX * 2);
  const viewHeight = snapshot.backboardHeightCm + (safePaddingY * 2);
  const stageWidth = EMAIL_CAPTURE_WIDTH * 0.92;
  const stageHeight = EMAIL_CAPTURE_HEIGHT * 0.82;
  const scale = Math.min(stageWidth / viewWidth, stageHeight / viewHeight);
  const offsetX = (EMAIL_CAPTURE_WIDTH - (viewWidth * scale)) / 2;
  const offsetY = (EMAIL_CAPTURE_HEIGHT - (viewHeight * scale)) / 2;

  return <div className="email-design-layers">
    {(snapshot.layers || []).map((layer) => {
      const width = layer.width_cm * scale;
      const height = layer.target_height_cm * scale;
      return <div
        key={layer.id}
        className="email-design-word"
        style={{
          left: `${offsetX + ((layer.x_cm - viewX) * scale)}px`,
          top: `${offsetY + ((layer.y_cm - viewY) * scale)}px`,
          width: `${width}px`,
          height: `${height}px`,
          color: layer.colorValue,
          fontFamily: layer.fontFamily,
          fontSize: `${height}px`,
          letterSpacing: `${(Number(layer.letter_spacing_cm) || 0) * scale}px`,
          transform: `rotate(${Number(layer.rotation_deg) || 0}deg)`,
          textShadow: `0 0 2px #fff, 0 0 7px ${layer.colorValue}, 0 0 18px ${layer.colorValue}, 0 0 38px ${layer.colorValue}`,
        }}
      >{layer.text}</div>;
    })}
  </div>;
}

export function CheckoutPage() {
  const [order] = useState(readStoredOrder);
  const orderNeonRef = useRef(null);
  const emailCaptureRef = useRef(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCheckoutSlide, setActiveCheckoutSlide] = useState(0);
  const [testEmailState, setTestEmailState] = useState({ status: 'idle', message: '' });
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
  const isDepositOrder = order?.tier === 'custom';
  const checkoutTokens = tokenizeNeonText(checkoutText);
  const isMultiColor = order?.colorMode === 'multi' && order?.wordColors?.length;
  const checkoutWordColors = new Map((order?.wordColors || []).map((item) => [item.wordIndex, item]));
  const checkoutFontSize = useFittedNeonText(orderNeonRef, checkoutText, order?.fontFamily || 'Manrope Variable', { maxSize: 82 });
  const fullPrice = Number(order?.estimatedPrice || order?.price || 0);
  const fontNameByFamily = new Map(sizingFonts.map((font) => [font.family, font.name]));
  const selectedFontNames = [...new Set((order?.designSnapshot?.layers || []).map((layer) => layer.fontName || fontNameByFamily.get(layer.fontFamily) || layer.fontFamily).filter(Boolean))];
  const fontSummary = selectedFontNames.length ? selectedFontNames.join(', ') : order?.fontName;
  const testCaptureEnabled = import.meta.env.VITE_DESIGN_CAPTURE_TEST_MODE === 'true';

  useEffect(() => {
    const snapshotFonts = (order?.designSnapshot?.layers || []).map((layer) => ({ family: layer.fontFamily, file: layer.fontFile })).filter((font) => font.family && font.file);
    const fontSources = snapshotFonts.length ? snapshotFonts : order?.fontName && order?.fontFamily ? [{ family: order.fontFamily, file: `/fonts/${encodeURIComponent(order.fontName)}.ttf` }] : [];
    if (!fontSources.length) return undefined;
    let active = true;
    Promise.allSettled(fontSources.map((font) => new FontFace(font.family, `url("${font.file}") format("truetype")`).load())).then((results) => {
      if (!active) return;
      results.forEach((result) => { if (result.status === 'fulfilled') document.fonts.add(result.value); });
    });
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
  const sendTestPreviewEmail = async () => {
    if (!testCaptureEnabled || !emailCaptureRef.current || testEmailState.status === 'sending') return;
    setTestEmailState({ status: 'sending', message: 'Menjana dan menghantar gambar test…' });
    try {
      await document.fonts.ready;
      const previewDataUrl = await toJpeg(emailCaptureRef.current, { quality: 0.9, pixelRatio: 1, cacheBust: true, backgroundColor: '#11131a' });
      const response = await fetch('/api/test-design-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previewDataUrl,
          reference: order.reference,
          text: order.text,
          textSize: order.sizeNote,
          backboardSize: order.backboardSizeNote,
          estimatedPrice: order.estimatedPrice,
          fonts: [...new Set((order.designSnapshot?.layers || []).map((layer) => layer.fontFamily))].join(', ') || order.fontName,
          colours: isMultiColor ? [...new Set(order.wordColors.map((item) => item.label))].join(', ') : order.colorLabel,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'Email test tidak berjaya dihantar.');
      setTestEmailState({ status: 'sent', message: `Email test dihantar. Cloudinary: ${result.previewUrl}` });
    } catch (captureError) {
      setTestEmailState({ status: 'error', message: captureError.message || 'Ujian gambar dan email gagal.' });
    }
  };

  return <main className="checkout-page">
    <header className="checkout-header"><a className="checkout-brand" href="/">PAKAR LED &amp; NEON <i>BY YH</i></a><div><span>Checkout selamat</span><strong>Semak sebelum bayar</strong></div></header>
    <div className="checkout-urgency" role="status" aria-label="Tempahan diproses mengikut giliran bayaran dan bayaran mengunci slot design anda.">
      <div className="checkout-urgency-track" aria-hidden="true">
        <span>Tempahan diproses mengikut giliran bayaran <b>•</b> Bayaran mengunci slot design anda <b>•</b></span>
        <span>Tempahan diproses mengikut giliran bayaran <b>•</b> Bayaran mengunci slot design anda <b>•</b></span>
      </div>
    </div>
    <nav className="checkout-progress" aria-label="Kemajuan checkout">
      <a className="checkout-progress-step complete" href="/#playground"><span>✓</span><strong>Configurator</strong></a>
      <div className="checkout-progress-step active" aria-current="step"><span>2</span><strong>Pengesahan</strong></div>
      <div className="checkout-progress-step"><span>3</span><strong>Bayaran</strong></div>
    </nav>
    <div className="checkout-layout">
      <form className="checkout-form checkout-card" onSubmit={submitOrder}>
        <a className="checkout-back checkout-back-prominent" href="/#playground">← Kembali ke configurator</a>
        <p className="checkout-kicker">Langkah 2 daripada 3</p>
        <h1>Sahkan tempahan</h1>
        <p className="checkout-lead">Lengkapkan maklumat di bawah dan semak ringkasan pesanan sebelum membuat bayaran.</p>
        <div className="checkout-fields">
          <label className="field-wide">Nama penuh<input name="name" value={customer.name} onChange={updateField} autoComplete="name" required /></label>
          <label>Nombor telefon<input name="phone" value={customer.phone} onChange={updateField} inputMode="tel" autoComplete="tel" placeholder="01X-XXXXXXX" required /></label>
          <label>Email <small>(wajib)</small><input name="email" type="email" value={customer.email} onChange={updateField} autoComplete="email" required /></label>
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
          </span>
          <span aria-hidden="true">{isSubmitting ? '···' : '→'}</span>
        </button>
        <p className="checkout-payment-note">Langkah seterusnya: pilih FPX atau QR Pay di halaman pembayaran.</p>
        <p className="checkout-privacy">Maklumat anda digunakan untuk urusan tempahan dan penghantaran sahaja.</p>
      </form>

      <aside className="order-review">
        <p className="checkout-kicker">Ringkasan pesanan</p>
        <div className="order-neon" ref={orderNeonRef} style={{ '--checkout-neon': order.colorValue, '--checkout-glow': order.colorGlow, fontFamily: order.fontFamily }}>
          <OrderDesignPreview snapshot={order.designSnapshot} fallback={<div className={`order-neon-text ${isMultiColor ? 'multi-color' : ''}`} data-text={isMultiColor ? undefined : checkoutText} style={{ fontSize: `${checkoutFontSize}px` }}>
            {isMultiColor ? checkoutTokens.map((token, index) => {
              if (token.type === 'space') return token.value;
              const wordColor = checkoutWordColors.get(token.wordIndex) || { value: order.colorValue, glow: order.colorGlow };
              return <span className="checkout-neon-word" key={`${token.value}-${index}`} data-text={token.value} style={{ '--checkout-neon': wordColor.value, '--checkout-glow': wordColor.glow }}>{token.value}</span>;
            }) : checkoutText}
          </div>} />
        </div>
        {testCaptureEnabled && <div className="email-design-capture" ref={emailCaptureRef} aria-hidden="true">
          <EmailDesignCapture snapshot={order.designSnapshot} fallback={<div className="email-design-fallback" style={{ color: order.colorValue, fontFamily: order.fontFamily }}>{checkoutText}</div>} />
        </div>}
        <dl>
          {order.text && <div><dt>Teks neon</dt><dd>{order.text}</dd></div>}
          {fontSummary && <div><dt>Font</dt><dd>{fontSummary}</dd></div>}
          {order.colorLabel && <div><dt>Warna</dt><dd>{isMultiColor ? [...new Set(order.wordColors.map((item) => item.label))].join(', ') : order.colorLabel}</dd></div>}
          <div><dt>Saiz tulisan</dt><dd>{order.sizeNote || 'Akan disahkan selepas design dibincangkan'}</dd></div>
          {order.backboardSizeNote && <div><dt>Saiz backboard</dt><dd>{order.backboardSizeNote}</dd></div>}
          {fullPrice > 0 && <div className="full-price-summary"><dt>Harga penuh</dt><dd>RM{fullPrice.toFixed(2)}</dd></div>}
          <div className="warranty-summary"><dt>Warranty</dt><dd>3 bulan<small>Warranty standard</small></dd></div>
        </dl>
        <div className="order-total"><span>{isDepositOrder ? 'Harga deposit' : 'Jumlah dibayar sekarang'}</span><div className="order-total-price"><strong>RM{Number(order.price).toFixed(2)}</strong><small>{isDepositOrder ? 'Dibayar sekarang · Ditolak daripada harga penuh' : 'QR PAY disediakan di halaman sebelah'}</small></div></div>
        <p className="estimate-note">{isDepositOrder ? 'Harga RM200 ke atas memerlukan deposit RM100. Kami akan menghubungi anda untuk mengesahkan design dan harga akhir; deposit ditolak daripada jumlah akhir.' : 'Jumlah bayaran ini mengikut harga anggaran live dalam configurator.'}</p>
        {testCaptureEnabled && <div className="test-capture-panel"><strong>Mod ujian gambar</strong><p>Upload ke folder Cloudinary test dan hantar email [TEST]. ToyyibPay serta order live tidak digunakan.</p><button type="button" onClick={sendTestPreviewEmail} disabled={testEmailState.status === 'sending'}>{testEmailState.status === 'sending' ? 'Sedang menghantar…' : 'Hantar Email Test Preview'}</button>{testEmailState.message && <small className={testEmailState.status}>{testEmailState.message}</small>}</div>}
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
