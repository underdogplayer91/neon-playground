import { useEffect, useRef, useState } from 'react';
import { limitNeonInput, useFittedNeonText } from './neonText';
const EmptyIcon = () => null;
const ArrowDown = EmptyIcon, ArrowRight = EmptyIcon, Check = EmptyIcon, Eye = EmptyIcon;
const Heart = EmptyIcon, InstagramLogo = EmptyIcon, Lightning = EmptyIcon, MapPin = EmptyIcon;
const Moon = EmptyIcon, Palette = EmptyIcon, PencilSimple = EmptyIcon, ShieldCheck = EmptyIcon;
const ShoppingBagOpen = EmptyIcon, Sun = EmptyIcon, Truck = EmptyIcon;
const fontNames = [
  'Alexa','Amanda','Amsterdam','Austin','Avante','Barcelona','Bayview','Beachfront','Buttercup','Chelsea',
  'Florence','Freehand','Freespirit','Greenworld','LazySunday','LosAngeles','LoveNote','Manchester','Melbourne','Monaco',
  'NeonLite','Neonscript','Neontrace','NeoTokyo','NewCursive','Northshore','NottingHill','Olivia','Photogenic','Rocket',
  'Royalty','SanDiego','Signature','Simplicity','Sorrento','Typewriter','Venetian','Vintage','Waikiki','Weekender',
  'WildScript'
];
const fonts = fontNames.map((name) => ({ id: name, name, family: `Neon-${name}`, file: `/fonts/${name}.ttf` }));
const featuredFonts = fonts.slice(0, 6);
const otherFonts = fonts.slice(6);
const colors = [
  { id: 'cool-white', label: 'Cool White', value: '#f4f7ff', glow: '244,247,255' },
  { id: 'warm-white', label: 'Warm White', value: '#ffd89a', glow: '255,216,154' },
  { id: 'green', label: 'Green', value: '#15e66f', glow: '21,230,111' },
  { id: 'blue', label: 'Blue', value: '#3157ff', glow: '49,87,255' },
  { id: 'ice-blue', label: 'Ice Blue', value: '#31d7ff', glow: '49,215,255' },
  { id: 'pink', label: 'Pink', value: '#ff3bbd', glow: '255,59,189' },
  { id: 'red', label: 'Red', value: '#ff322b', glow: '255,50,43' },
  { id: 'purple', label: 'Purple', value: '#9b45ff', glow: '155,69,255' },
  { id: 'yellow', label: 'Yellow', value: '#ffe13b', glow: '255,225,59' },
  { id: 'orange', label: 'Orange', value: '#ff941f', glow: '255,148,31' },
];
const portfolioItems = [
  { src: '/assets/media/gallery-storefront.webp', title: 'Signage pintu kedai', type: 'Kedai fizikal' },
  { src: '/assets/contoh-hasil/1.jpeg', title: 'Event', type: 'Tulisan custom' },
  { src: '/assets/media/IMG_20260625_143521.jpg', title: 'AL-ARJANS', type: 'Logo & tulisan' },
  { src: '/assets/media/gallery-jiwa-yogulp.webp', title: 'Jiwa Yogulp', type: 'Depan cermin' },
  { src: '/assets/media/WhatsApp Image 2024-03-12 at 3.30.06 PM.jpeg', title: 'MEK BIHA LOKCING', type: 'Signage gerai' },
  { src: '/assets/media/gallery-happy-birthday.webp', title: 'Happy Birthday', type: 'Majlis & dekorasi' },
];
const posterSlides = [
  { src: '/assets/contoh-hasil/1.jpeg', alt: 'Contoh hasil neon LED 1' },
  { src: '/assets/contoh-hasil/2.png', alt: 'Contoh hasil neon LED 2' },
  { src: '/assets/contoh-hasil/3.jpg', alt: 'Contoh hasil neon LED 3' },
  { src: '/assets/contoh-hasil/4.jpg', alt: 'Contoh hasil neon LED 4' },
  { src: '/assets/contoh-hasil/AYAM GORENG RM1.jpg', alt: 'Neon Ayam Goreng RM1' },
  { src: '/assets/contoh-hasil/AYAM GUNTING.jpg', alt: 'Neon Ayam Gunting' },
  { src: '/assets/contoh-hasil/EZZATI CATERING.jpg', alt: 'Neon Ezzati Catering' },
  { src: '/assets/contoh-hasil/KAK ZAN NASI AYAM TUMPAT.jpg', alt: 'Neon Kak Zan Nasi Ayam Tumpat' },
  { src: '/assets/contoh-hasil/open rehat close.png', alt: 'Neon Open Rehat Close' },
  { src: '/assets/contoh-hasil/TERATAK POKOK RHU.jpg', alt: 'Neon Teratak Pokok Rhu' },
  { src: '/assets/contoh-hasil/WAK IKHSAN KEBAB.jpg', alt: 'Neon Wak Ikhsan Kebab' },
  { src: '/assets/contoh-hasil/WhatsApp Image 2024-02-04 at 4.25.46 PM.jpeg', alt: 'Contoh hasil neon LED pelanggan' },
  { src: '/assets/contoh-hasil/WhatsApp Image 2024-03-28 at 1.57.21 PM.jpeg', alt: 'Contoh hasil neon LED pelanggan' },
  { src: '/assets/contoh-hasil/WhatsApp Image 2024-09-16 at 13.06.07_074a8094.jpg', alt: 'Contoh hasil neon LED pelanggan' },
  { src: '/assets/contoh-hasil/WhatsApp Image 2024-09-16 at 13.23.55_18c51137.jpg', alt: 'Contoh hasil neon LED pelanggan' },
  { src: '/assets/contoh-hasil/WhatsApp Image 2024-09-26 at 15.33.26_a38948c2.jpg', alt: 'Contoh hasil neon LED pelanggan' },
  { src: '/assets/contoh-hasil/WhatsApp Image 2024-11-13 at 15.01.07_f2881413.jpg', alt: 'Contoh hasil neon LED pelanggan' },
];
const testimonials = [
  {
    business: 'Daisy Coffee',
    label: 'Hasil kerja',
    src: '/assets/testimoni/testimoni-daisy-coffee.jpeg',
    alt: 'Screenshot testimoni sebenar pelanggan Daisy Coffee selepas menerima neon',
  },
  {
    business: 'Amir Tomyam',
    label: 'Nampak real',
    src: '/assets/testimoni/testimoni-amir-tomyam.jpeg',
    alt: 'Screenshot testimoni sebenar pelanggan Amir Tomyam selepas neon dipasang',
  },
  {
    business: 'Tang Wagyu',
    label: 'Cantik',
    src: '/assets/testimoni/testimoni-tang-wagyu.jpeg',
    alt: 'Screenshot testimoni sebenar pelanggan Tang Wagyu tentang neon yang cantik',
  },
  {
    business: 'Abah Cool Station',
    label: 'Kedai menyerlah',
    src: '/assets/testimoni/testimoni-abah-cool-station.jpeg',
    alt: 'Screenshot testimoni sebenar pelanggan Abah Cool Station selepas menggunakan neon',
  },
  {
    business: 'Mek Biha Lokcing',
    label: 'Kemas & comel',
    src: '/assets/testimoni/testimoni-mek-biha-lokcing.jpeg',
    alt: 'Screenshot testimoni sebenar pelanggan Mek Biha Lokcing semasa pemasangan neon',
  },
];
const heroImage = {
  src: '/assets/hero-storefront-v2.png',
  alt: 'Kedai Kopi Jiwa dengan neon pada cermin dalam paparan siang dan malam',
};
const countCharacters = (value) => [...value.replace(/\s/g, '')].length;
const getPackage = (count) => {
  if (!count) return { name: 'Belum dipilih', price: null, tier: 'none' };
  if (count <= 8) return { name: 'Pakej 8 Huruf', price: 150, tier: 'basic' };
  if (count <= 15) return { name: 'Pakej 15 Huruf', price: 200, tier: 'plus' };
  return { name: 'Sebut Harga Khas', price: null, tier: 'custom' };
};
const ORDER_KEY = 'yh-neon-checkout-order';

function Header() {
  return <header className="site-header">
    <a className="brand" href="#top"><span>PAKAR LED &amp; NEON</span><i>BY YH</i></a>
    <nav><a href="#playground">Reka Neon</a><a href="#inspirasi">Inspirasi</a><a href="#cara">Cara Tempah</a><a href="#faq">FAQ</a></nav>
    <a className="header-cta" href="#playground"><PencilSimple weight="bold" /> Cuba Sekarang</a>
  </header>;
}

export function App() {
  const [text, setText] = useState('Kopi Jiwa');
  const [fontId, setFontId] = useState('Alexa');
  const [colorId, setColorId] = useState('pink');
  const [backgroundMode, setBackgroundMode] = useState('night');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activePosterSlide, setActivePosterSlide] = useState(0);
  const previewStageRef = useRef(null);
  const characterCount = countCharacters(text);
  const selectedPackage = getPackage(characterCount);
  const selectedFont = fonts.find((font) => font.id === fontId);
  const selectedColor = colors.find((color) => color.id === colorId);
  const displayText = text.trim() || 'Nama Kedai Anda';
  const previewFontSize = useFittedNeonText(previewStageRef, displayText, selectedFont.family);
  useEffect(() => {
    fonts.forEach((font) => {
      const face = new FontFace(font.family, `url(${font.file})`);
      face.load().then((loaded) => document.fonts.add(loaded)).catch(() => {});
    });
  }, []);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => {
      setActivePosterSlide((current) => {
        let next = current;
        while (next === current) next = Math.floor(Math.random() * posterSlides.length);
        return next;
      });
    }, 3800);
    return () => window.clearInterval(timer);
  }, []);
  const checkoutUrl = characterCount ? '/checkout' : '#playground';
  const prepareCheckout = () => {
    if (!characterCount) return;
    const tier = selectedPackage.price ? selectedPackage.tier : 'custom';
    window.sessionStorage.setItem(ORDER_KEY, JSON.stringify({
      reference: `YH-${Date.now().toString(36).toUpperCase()}`,
      tier,
      packageName: selectedPackage.price ? selectedPackage.name : 'Design Custom',
      price: selectedPackage.price || 100,
      text: text.trim(),
      characterCount,
      fontName: selectedFont.name,
      fontFamily: selectedFont.family,
      colorLabel: selectedColor.label,
      colorValue: selectedColor.value,
      colorGlow: selectedColor.glow,
      backgroundMode,
      sizeNote: tier === 'basic' ? 'Panjang bawah 60 cm' : tier === 'plus' ? 'Panjang bawah 85 cm' : 'Custom size',
    }));
  };
  const prepareCustomCheckout = () => window.sessionStorage.setItem(ORDER_KEY, JSON.stringify({
    reference: `YH-${Date.now().toString(36).toUpperCase()}`,
    tier: 'custom',
    packageName: 'Design Custom',
    price: 100,
    text: '',
    characterCount: 0,
    fontName: '',
    fontFamily: 'Manrope Variable',
    colorLabel: '',
    colorValue: '#31d7ff',
    colorGlow: '49,215,255',
    backgroundMode: 'night',
    sizeNote: 'Custom size & design',
  }));
  const interact = () => setHasInteracted(true);

  return <main id="top">
    <Header />
    <section className="hero">
      <div className="hero-slides"><img className="active" src={heroImage.src} alt={heroImage.alt} fetchPriority="high" /></div>
      <div className="hero-shade" />
      <div className="hero-content">
        <p className="eyebrow"><MapPin weight="fill" /> Untuk owner kedai fizikal</p>
        <h1>Dari kedai biasa<br />kepada kedai yang<br /><em>orang ingat.</em></h1>
        <p className="hero-copy">Neon LED custom yang menjadikan jenama anda nampak premium, siang dan malam.</p>
        <a className="primary-button" href="#playground">Cuba Nama Kedai Anda <ArrowDown weight="bold" /></a>
        <div className="hero-note"><Check weight="bold" /> Reka · Sahkan · Baru kami hasilkan</div>
      </div>
      <div className="day-label">Siang biasa-biasa.</div><div className="night-label">Malam semua nampak kedai anda.</div>
    </section>

    <section className="benefit-strip">
      <article><span>01</span><Eye /><div><h3>Tak lagi tenggelam</h3><p>Nama kedai lebih jelas bila malam.</p></div></article>
      <article><span>02</span><Heart /><div><h3>Nampak & dikenali</h3><p>Bina identiti yang orang mudah ingat.</p></div></article>
      <article><span>03</span><InstagramLogo /><div><h3>Jadi photo spot</h3><p>Buat pelanggan mahu rakam dan kongsi.</p></div></article>
    </section>

    <section className="playground-section" id="playground">
      <div className="section-intro light"><p className="eyebrow"><Lightning weight="fill" /> Neon Playground</p><h2>Cuba nama kedai anda.<br /><em>Lihat ia menyala.</em></h2><p>Tak perlu teka hasilnya. Main dengan font dan warna sampai jumpa gaya yang terasa seperti jenama anda.</p></div>
      <div className={`configurator ${backgroundMode}`}>
        <div className="controls-panel">
          <div className="field-head"><span>01</span><label htmlFor="shop-name">Taip nama kedai anda</label></div>
          <textarea id="shop-name" value={text} maxLength={61} rows={2} onChange={(e) => { setText(limitNeonInput(e.target.value)); interact(); }} placeholder={'Contoh:\nKopi Jiwa'} />
          <div className={`count-row ${characterCount > 15 ? 'over' : ''}`}><span>{characterCount} huruf</span><small>Maks. 30 setiap perkataan</small></div>
          <div className="field-head"><span>02</span><label htmlFor="other-font-select">Pilih font</label></div>
          <div className="featured-fonts" role="radiogroup" aria-label="Pilihan font utama">
            {featuredFonts.map((font) => <button
              key={font.id}
              type="button"
              className={fontId === font.id ? 'selected' : ''}
              style={{ fontFamily: font.family }}
              onClick={() => { setFontId(font.id); interact(); }}
              role="radio"
              aria-checked={fontId === font.id}
            >{font.name}</button>)}
          </div>
          <div className="other-font-field">
            <label htmlFor="other-font-select">Other Font</label>
            <select id="other-font-select" className="font-select" value={otherFonts.some((font) => font.id === fontId) ? fontId : ''} style={{ fontFamily: otherFonts.some((font) => font.id === fontId) ? selectedFont.family : undefined }} onChange={(e) => { if (e.target.value) { setFontId(e.target.value); interact(); } }}>
              <option value="">Other Font — Pilih font lain</option>
              {otherFonts.map((font) => <option key={font.id} value={font.id} style={{ fontFamily: font.family }}>{font.name}</option>)}
            </select>
          </div>
          <div className="field-head"><span>03</span><label>Pilih warna</label></div>
          <div className="color-options" role="radiogroup">{colors.map((color) => <button key={color.id} className={colorId === color.id ? 'selected' : ''} style={{ '--swatch': color.value }} onClick={() => { setColorId(color.id); interact(); }} aria-label={color.label} role="radio" aria-checked={colorId === color.id} />)}</div>
        </div>
        <div className="preview-stage" ref={previewStageRef}>
          <img src="/assets/configurator-wall.png" alt="Dinding kedai untuk pratonton neon" />
          <div className="mode-toggle"><button className={backgroundMode === 'day' ? 'active' : ''} onClick={() => { setBackgroundMode('day'); interact(); }}><Sun /> Siang</button><button className={backgroundMode === 'night' ? 'active' : ''} onClick={() => { setBackgroundMode('night'); interact(); }}><Moon /> Malam</button></div>
          <div className="neon-text" data-text={displayText} style={{ '--neon': selectedColor.value, '--glow': selectedColor.glow, fontFamily: selectedFont.family, fontSize: `${previewFontSize}px`, lineHeight: 1 }}>{displayText}</div>
          {!text.trim() && <span className="preview-hint">Taip sesuatu untuk mula mereka</span>}
        </div>
      </div>
      <div className="live-summary" aria-live="polite">
        <div><span>Pilihan anda</span><strong>{selectedPackage.name}</strong></div>
        <div className="summary-price"><span>{selectedPackage.price ? 'Harga tetap' : 'Harga'}</span><strong>{selectedPackage.price ? `RM${selectedPackage.price}` : characterCount ? 'Sebut harga khas' : '—'}</strong></div>
        <a className={`order-button ${!characterCount ? 'disabled' : ''}`} href={checkoutUrl} onClick={prepareCheckout}><ShoppingBagOpen weight="fill" /> Tempah Sekarang</a>
      </div>
    </section>

    <section className="pricing" id="harga">
      <div className="section-intro"><p className="eyebrow"><Palette weight="fill" /> Tiga cara untuk mula</p><h2>Pilih pakej siap<br /><em>atau design custom.</em></h2><p>RM150 dan RM200 menghasilkan neon berdasarkan teks, font dan warna dalam configurator. Lebih banyak huruf menghasilkan rekaan lebih panjang, tertakluk pada had saiz pakej.</p></div>
      <div className="price-list">
        <article className={selectedPackage.tier === 'basic' ? 'active' : ''}><span className="package-number">01</span><div><p>Ikut configurator · panjang bawah 60 cm</p><h3>Sehingga 8 huruf</h3></div><strong>RM150</strong><a href="#playground">Cuba pakej ini <ArrowRight /></a></article>
        <article className={selectedPackage.tier === 'plus' ? 'active' : ''}><span className="package-number">02</span><div><p>Ikut configurator · panjang bawah 85 cm</p><h3>Sehingga 15 huruf</h3></div><strong>RM200</strong><a href="#playground">Cuba pakej ini <ArrowRight /></a></article>
        <article className="custom-package"><span className="package-number">03</span><div><p>Deposit design sahaja</p><h3>Custom size & design</h3></div><strong>RM100</strong><a href="/checkout" onClick={prepareCustomCheckout}>Tempah design custom <ArrowRight /></a></article>
      </div><div className="pricing-clarity"><p><strong>RM150 / RM200:</strong> panjang rekaan bertambah mengikut jumlah huruf—di bawah 60 cm untuk RM150 dan di bawah 85 cm untuk RM200.</p><p><strong>RM100:</strong> deposit servis design sahaja. Deposit ini akan ditolak daripada harga akhir neon custom.</p><p><strong>Penghantaran pakej RM150 / RM200:</strong> maksimum RM10 untuk Semenanjung dan RM40 untuk Sabah atau Sarawak. Caj dibayar oleh penerima apabila barang sampai.</p></div>
    </section>

    <section className="package-includes" id="dalam-pakej" aria-labelledby="package-includes-title">
      <div className="package-includes-grid">
        <figure className="package-includes-visual"><img src="/assets/package-includes.jfif" alt="Custom neon LED bersama power adapter, black PVC dan mounting set" loading="lazy" /></figure>
        <div className="package-includes-copy">
          <p className="eyebrow">Lengkap dalam kotak</p>
          <h2 id="package-includes-title">Apa yang anda dapat<br /><em>bila dah beli.</em></h2>
          <p className="package-includes-lead">Dah sampai, sambungkan adapter dan neon anda sedia untuk dinyalakan.</p>
          <div className="package-includes-list">
            <article><span>01</span><h3>Power Adapter 12V</h3><p>Bekalan kuasa untuk menyalakan neon LED.</p></article>
            <article><span>02</span><h3>Black PVC</h3><p>Tapak belakang PVC hitam untuk hasil yang kemas.</p></article>
            <article><span>03</span><h3>Custom Neon LED</h3><p>Neon mengikut teks, font dan warna tempahan anda.</p></article>
            <article><span>04</span><h3>Mounting</h3><p>Aksesori asas untuk menggantung atau memasang neon.</p></article>
          </div>
          <small>Servis pemasangan di lokasi tidak termasuk.</small>
        </div>
      </div>
    </section>

    <section className="inspiration" id="inspirasi">
      <div className="section-intro light"><p className="eyebrow">Hasil sebenar pelanggan</p><h2>Bukan gambar AI.<br /><em>Ini neon yang dah siap.</em></h2><p>Contoh sebenar daripada tempahan pelanggan—diambil dalam keadaan dan lokasi sebenar.</p></div>
      <div className="real-gallery">{portfolioItems.map((item, index) => <figure key={item.src} className={index === 0 ? 'wide' : ''}><img src={item.src} alt={`${item.title}, hasil neon LED sebenar`} loading="lazy" /><figcaption><span>{item.type}</span><strong>{item.title}</strong></figcaption></figure>)}</div>
      <div className="type-poster">
        <div className="poster-copy"><span>01 / CONTOH HASIL</span><h3>Contoh hasil sebenar<br /><em>daripada Neon Playground</em><br />di atas.</h3><p>Gunakan configurator untuk cuba teks, font dan warna sebelum membuat tempahan.</p></div>
        <figure className="poster-slideshow" aria-label="Slideshow hasil neon sebenar">
          {posterSlides.map((slide, index) => <img key={slide.src} className={activePosterSlide === index ? 'active' : ''} src={slide.src} alt={slide.alt} aria-hidden={activePosterSlide !== index} loading="lazy" />)}
          <figcaption><span>Hasil sebenar</span><strong>{String(activePosterSlide + 1).padStart(2, '0')} / {String(posterSlides.length).padStart(2, '0')}</strong></figcaption>
        </figure>
      </div>
    </section>

    <section className="transformation-section">
      <div className="section-intro"><p className="eyebrow">Sebelum dan selepas</p><h2>Dari lampu atas meja<br /><em>ke tarikan dalam kedai.</em></h2><p>Dua pemasangan sebenar yang menunjukkan bagaimana neon berubah apabila masuk ke ruang pelanggan.</p></div>
      <div className="transformation-grid"><figure><img src="/assets/media/before-after-pizza.webp" alt="Sebelum dan selepas neon 480 Pizza dipasang" loading="lazy" /><figcaption><span>480 Pizza</span><strong>Nampak dari luar premis</strong></figcaption></figure><figure><img src="/assets/media/before-after-amir.webp" alt="Sebelum dan selepas neon Amir Tomyam dipasang" loading="lazy" /><figcaption><span>Amir Tomyam</span><strong>Jadi titik fokus ruang makan</strong></figcaption></figure></div>
    </section>

    <section className="testimonials-section" id="testimoni" aria-label="Testimoni pelanggan sebenar">
      <div className="testimonial-intro"><p className="eyebrow">Screenshot sebenar pelanggan</p><h2>Apa pelanggan<br /><em>cakap lepas pasang.</em></h2><p>Screenshot WhatsApp asal digunakan tanpa mereka semula conversation. Klik nama untuk lihat testimoni seterusnya.</p><div className="testimonial-tabs" role="tablist">{testimonials.map((item, index) => <button key={item.business} className={activeTestimonial === index ? 'active' : ''} onClick={() => setActiveTestimonial(index)} role="tab" aria-selected={activeTestimonial === index}>{item.business}</button>)}</div></div>
      <figure className="testimonial-proof" aria-live="polite"><div className="testimonial-proof-head"><div className="chat-avatar">{testimonials[activeTestimonial].business.charAt(0)}</div><div><strong>{testimonials[activeTestimonial].business}</strong><span>{testimonials[activeTestimonial].label}</span></div><i>Gambar asal</i></div><div className="testimonial-proof-image"><img key={testimonials[activeTestimonial].src} src={testimonials[activeTestimonial].src} alt={testimonials[activeTestimonial].alt} /></div><figcaption className="chat-foot"><button onClick={() => setActiveTestimonial((activeTestimonial - 1 + testimonials.length) % testimonials.length)} aria-label="Testimoni sebelumnya">←</button><span>{String(activeTestimonial + 1).padStart(2, '0')} / {String(testimonials.length).padStart(2, '0')}</span><button onClick={() => setActiveTestimonial((activeTestimonial + 1) % testimonials.length)} aria-label="Testimoni seterusnya">→</button></figcaption></figure>
    </section>

    <section className="making-section" id="proses-pembuatan">
      <div className="making-heading"><div><p className="eyebrow">Di sebalik neon</p><h2>Macam mana kami<br /><em>jadikan ia lampu.</em></h2></div><p>Daripada tapak PVC yang dipotong mengikut design, LED dipasang satu persatu sebelum setiap neon diuji dan dinyalakan.</p></div>
      <figure className="making-video-frame">
        <video autoPlay muted loop playsInline preload="metadata" poster="/assets/proses-neon/proses-pembuatan-neon-poster.jpg" aria-label="Video proses menghasilkan custom neon LED">
          <source src="/assets/proses-neon/proses-pembuatan-neon.mp4" type="video/mp4" />
          Browser anda tidak menyokong video HTML5.
        </video>
      </figure>
    </section>

    <section className="process" id="cara"><div className="section-intro"><p className="eyebrow">Cara tempahan</p><h2>Dari idea ke neon<br /><em>dalam 4 langkah.</em></h2></div><ol><li><span>01</span><PencilSimple /><h3>Pilih</h3><p>Guna configurator atau pilih servis Design Custom.</p></li><li><span>02</span><ShoppingBagOpen /><h3>Tempah</h3><p>Teruskan tempahan melalui payment gateway yang selamat.</p></li><li><span>03</span><ShieldCheck /><h3>Sahkan</h3><p>Semak mockup akhir. Design custom bermula selepas deposit RM100.</p></li><li><span>04</span><Truck /><h3>Hasilkan</h3><p>Pengeluaran bermula selepas mockup dan bayaran berkaitan disahkan.</p></li></ol><a className="process-order-button" href="#playground"><ShoppingBagOpen weight="fill" /> Tempah Sekarang <ArrowRight /></a></section>

    <section className="faq" id="faq"><div className="section-intro light"><p className="eyebrow">Soalan biasa</p><h2>Sebelum neon anda<br /><em>mula menyala.</em></h2></div><div className="faq-list"><details><summary>Adakah RM150 dan RM200 ikut rekaan configurator?</summary><p>Ya. Teks, font dan warna pilihan anda menjadi rujukan tempahan. Pakej RM150 mempunyai panjang bawah 60 cm dan pakej RM200 bawah 85 cm. Semakin banyak huruf, semakin panjang hasilnya sehingga had maksimum pakej.</p></details><details><summary>Bagaimana huruf dikira?</summary><p>Huruf, nombor, tanda baca dan simbol dikira. Ruang serta line break tidak dikira.</p></details><details><summary>Kalau nama kedai lebih 15 huruf?</summary><p>Anda masih boleh lihat preview. Keperluan dan harga penghasilan akan dibincangkan melalui WhatsApp.</p></details><details><summary>Apakah maksud deposit Design Custom RM100?</summary><p>RM100 ialah deposit untuk servis design sahaja bagi custom size, logo, simbol atau bentuk khas. Designer akan berbincang dengan anda melalui WhatsApp. Deposit RM100 akan ditolak daripada harga akhir neon custom.</p></details><details><summary>Boleh digunakan di luar kedai?</summary><p>Tawaran standard ialah untuk indoor. Permintaan outdoor memerlukan semakan bahan dan quotation manual melalui WhatsApp.</p></details><details><summary>Adakah pemasangan dan penghantaran termasuk?</summary><p>Pemasangan tidak termasuk. Untuk pakej RM150 dan RM200, caj penghantaran maksimum RM10 bagi Semenanjung dan RM40 bagi Sabah atau Sarawak. Caj penghantaran dibayar oleh penerima apabila barang sampai.</p></details></div></section>
    <footer><div className="brand footer-brand"><span>PAKAR LED &amp; NEON</span><i>BY YH</i></div><p>Jangan biar kedai anda tenggelam bila malam.</p><a href="#playground">Cuba nama kedai anda <ArrowRight /></a></footer>
    {hasInteracted && <div className="mobile-sticky"><div><small>{selectedPackage.name}</small><strong>{selectedPackage.price ? `RM${selectedPackage.price}` : 'Deposit RM100'}</strong></div><a className={!characterCount ? 'disabled' : ''} href={checkoutUrl} onClick={prepareCheckout}><ShoppingBagOpen weight="fill" /> Tempah Sekarang</a></div>}
  </main>;
}
