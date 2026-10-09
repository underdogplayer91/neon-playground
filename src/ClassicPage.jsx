import './classic.css';
import { useEffect, useRef, useState } from 'react';
import { limitNeonInput, tokenizeNeonText, useFittedNeonText } from './neonText';
import { getMetaAttribution, trackMetaEventOnce } from './metaPixel';
import { createDisplayReference } from './orderReference';
import { ClassicCustomerSlider } from './ClassicCustomerSlider';
import { ClassicComparison } from './ClassicComparison';
import { getClassicPackage } from './classicPricing';
import { getClassicSizeGuide } from './classicSizing';
import { ClassicSizeGuides } from './ClassicSizeGuides';
import { ClassicBusinessHero } from './ClassicBusinessHero';
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
const countCharacters = (value) => [...value.replace(/\s/g, '')].length;
const ORDER_KEY = 'yh-neon-checkout-order';

function Header() {
  return <header className="site-header">
    <a className="brand" href="#top"><span>PAKAR LED &amp; NEON</span><i>BY YH</i></a>
    <nav><a href="#playground">Reka Neon</a><a href="#inspirasi">Inspirasi</a><a href="#faq">FAQ</a></nav>
    <a className="header-cta" href="#playground"><PencilSimple weight="bold" /> Cuba Sekarang</a>
  </header>;
}

export function ClassicPage() {
  const [text, setText] = useState('');
  const [fontId, setFontId] = useState('Beachfront');
  const [colorId, setColorId] = useState('pink');
  const [colorMode, setColorMode] = useState('multi');
  const [wordColorIds, setWordColorIds] = useState({ 0: 'pink', 1: 'yellow', 2: 'pink' });
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [colorMessage, setColorMessage] = useState('');
  const [isOtherFontsOpen, setIsOtherFontsOpen] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(3);
  const previewStageRef = useRef(null);
  const nameFieldRef = useRef(null);
  const namePromptTimerRef = useRef(null);
  const characterCount = countCharacters(text);
  const selectedPackage = getClassicPackage(characterCount);
  const sizeGuide = getClassicSizeGuide(text);
  const displayText = text.trim() || 'tulis nama anda';
  const selectedFont = fonts.find((font) => font.id === fontId);
  const selectedColor = colors.find((color) => color.id === colorId);
  const previewTokens = tokenizeNeonText(displayText);
  const wordTokens = previewTokens.filter((token) => token.type === 'word');
  const activeColorId = colorMode === 'multi' ? (wordColorIds[activeWordIndex] || colorId) : colorId;
  const getWordColor = (wordIndex) => colors.find((color) => color.id === (wordColorIds[wordIndex] || colorId)) || selectedColor;
  const previewFontSize = useFittedNeonText(previewStageRef, displayText, selectedFont.family, { widthRatio: 0.84, singleLineHeightRatio: 0.45, multiLineHeightRatio: 0.65 });
  useEffect(() => {
    if (window.location.hash) return;
    const playground = document.getElementById('playground');
    if (!playground) return;
    window.history.replaceState(null, '', '#playground');
    window.requestAnimationFrame(() => playground.scrollIntoView({ block: 'start' }));
  }, []);
  useEffect(() => {
    trackMetaEventOnce('view-content:neon-classic', 'ViewContent', {
      landing_source: 'neon-classic',
      content_name: 'Custom Neon LED',
      content_category: 'Indoor Custom Neon LED',
      content_type: 'product',
      currency: 'MYR',
      value: 150,
    });
  }, []);
  useEffect(() => {
    fonts.forEach((font) => {
      const face = new FontFace(font.family, `url(${font.file})`);
      face.load().then((loaded) => document.fonts.add(loaded)).catch(() => {});
    });
  }, []);
  useEffect(() => {
    if (activeWordIndex >= wordTokens.length) setActiveWordIndex(Math.max(0, wordTokens.length - 1));
  }, [activeWordIndex, wordTokens.length]);
  useEffect(() => () => window.clearTimeout(namePromptTimerRef.current), []);
  const chooseColor = (nextColorId) => {
    if (colorMode === 'single') {
      setColorId(nextColorId);
      setColorMessage('');
      interact();
      return;
    }
    const nextAssignments = { ...wordColorIds, [activeWordIndex]: nextColorId };
    const usedColors = new Set(wordTokens.map((token) => nextAssignments[token.wordIndex] || colorId));
    if (usedColors.size > 3) {
      setColorMessage('Maksimum 3 warna untuk satu design.');
      return;
    }
    setWordColorIds(nextAssignments);
    setColorMessage('');
    interact();
  };
  const checkoutUrl = characterCount ? '/checkout' : '#playground';
  const prepareCheckout = () => {
    if (!characterCount) return;
    const tier = selectedPackage.price ? selectedPackage.tier : 'custom';
    window.sessionStorage.setItem(ORDER_KEY, JSON.stringify({
      reference: `YH-${Date.now().toString(36).toUpperCase()}`,
      displayReference: createDisplayReference(),
      tier,
      packageName: selectedPackage.price ? selectedPackage.name : 'Design Custom',
      price: selectedPackage.price || 100,
      estimatedPrice: selectedPackage.estimatedPrice || selectedPackage.price,
      pricingModel: 'classic-package',
      landingSource: 'neon-classic',
      text: text.trim(),
      characterCount,
      fontName: selectedFont.name,
      fontFamily: selectedFont.family,
      colorLabel: selectedColor.label,
      colorValue: selectedColor.value,
      colorGlow: selectedColor.glow,
      colorMode,
      wordColors: colorMode === 'multi' ? wordTokens.map((token) => {
        const wordColor = getWordColor(token.wordIndex);
        return { wordIndex: token.wordIndex, text: token.value, colorId: wordColor.id, label: wordColor.label, value: wordColor.value, glow: wordColor.glow };
      }) : [],
      backgroundMode: 'night',
      tracking: getMetaAttribution(),
      sizeNote: tier === 'basic' ? 'Panjang bawah 60 cm' : tier === 'plus' ? 'Panjang bawah 85 cm' : 'Custom size · ukuran akhir disahkan designer',
    }));
  };
  const prepareCustomCheckout = () => window.sessionStorage.setItem(ORDER_KEY, JSON.stringify({
    reference: `YH-${Date.now().toString(36).toUpperCase()}`,
    displayReference: createDisplayReference(),
    tier: 'custom',
    pricingModel: 'classic-package',
    landingSource: 'neon-classic',
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
    tracking: getMetaAttribution(),
    sizeNote: 'Custom size & design',
  }));
  const interact = () => {
    trackMetaEventOnce('customize-product:neon-classic', 'CustomizeProduct', {
      landing_source: 'neon-classic',
      content_name: 'Neon Playground',
      interaction_type: 'configurator',
    }, { custom: true });
  };
  const focusNameField = (event) => {
    event.preventDefault();
    const field = nameFieldRef.current;
    if (!field) return;
    window.clearTimeout(namePromptTimerRef.current);
    setShowNamePrompt(false);
    window.requestAnimationFrame(() => {
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      field.focus({ preventScroll: true });
      setShowNamePrompt(true);
      namePromptTimerRef.current = window.setTimeout(() => setShowNamePrompt(false), 1600);
    });
  };
  const handleMobileOrderClick = (event) => {
    if (!characterCount) {
      focusNameField(event);
      return;
    }
    prepareCheckout();
  };

  return <main id="top">
    <Header />
    <ClassicBusinessHero />

    <section className="playground-section" id="playground">
      <div className="section-intro light"><p className="eyebrow"><Lightning weight="fill" /> Neon Playground</p><h2>Tulis perkataan anda.<br /><em>Biar ia menyala.</em></h2><p className="playground-prompt">Tak tahu nak tulis apa? Cuba nama anda, nama kedai, barang yang dijual, tajuk podcast, hiasan bilik, kata-kata hikmah atau quote untuk kafe.</p></div>
      <div className="configurator preview">
        <div className="controls-panel">
          <div className="field-head"><span>01</span><label htmlFor="shop-name">Taip nama kedai anda</label></div>
          <textarea ref={nameFieldRef} id="shop-name" className={showNamePrompt ? 'name-attention' : ''} value={text} maxLength={240} rows={4} autoCapitalize="none" autoCorrect="off" spellCheck={false} onChange={(e) => { setText(limitNeonInput(e.target.value)); interact(); }} placeholder="Masukkan nama anda" />
          <p className="lowercase-tip">Saranan: Huruf kecil semua lebih digalakkan untuk tulisan bersambung supaya nampak lebih kemas dan profesional.</p>
          <div className={`count-row ${characterCount > 15 ? 'over' : ''}`}><span>{characterCount} huruf</span><small>Maks. 6 baris · 30 huruf/perkataan</small></div>
          <div className="field-head"><span>02</span><label htmlFor="other-font-select">Pilih font</label></div>
          <div className="featured-fonts" role="radiogroup" aria-label="Pilihan font utama">
            {featuredFonts.map((font) => <button
              key={font.id}
              type="button"
              className={fontId === font.id ? 'selected' : ''}
              style={{ fontFamily: font.family }}
              onClick={() => { setFontId(font.id); setIsOtherFontsOpen(false); interact(); }}
              role="radio"
              aria-checked={fontId === font.id}
            >{font.name}</button>)}
          </div>
          <div className="other-font-field">
            <span className="other-font-label" id="other-font-label">Other Font · {otherFonts.length} pilihan lagi</span>
            <div className="font-dropdown" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsOtherFontsOpen(false); }}>
              <button
                type="button"
                className="font-dropdown-trigger"
                aria-labelledby="other-font-label other-font-trigger-text"
                aria-expanded={isOtherFontsOpen}
                aria-controls="other-font-options"
                onClick={() => setIsOtherFontsOpen((current) => !current)}
                style={{ fontFamily: otherFonts.some((font) => font.id === fontId) ? selectedFont.family : undefined }}
              ><span id="other-font-trigger-text">{otherFonts.some((font) => font.id === fontId) ? selectedFont.name : 'Pilih font lain'}</span><i aria-hidden="true">⌄</i></button>
              {isOtherFontsOpen && <div className="font-dropdown-list" id="other-font-options" role="listbox" aria-label="Pilihan font lain">
                {otherFonts.map((font) => <button
                  type="button"
                  key={font.id}
                  role="option"
                  aria-selected={fontId === font.id}
                  className={fontId === font.id ? 'selected' : ''}
                  style={{ fontFamily: font.family }}
                  onClick={() => { setFontId(font.id); setIsOtherFontsOpen(false); interact(); }}
                >{font.name}</button>)}
              </div>}
            </div>
          </div>
          <div className="field-head"><span>03</span><label>Pilih warna</label></div>
          <div className="color-mode-tabs" aria-label="Cara pemilihan warna">
            <button type="button" className={colorMode === 'single' ? 'active' : ''} onClick={() => { setColorMode('single'); setColorMessage(''); interact(); }}>Satu warna</button>
            <button type="button" className={colorMode === 'multi' ? 'active' : ''} onClick={() => { setColorMode('multi'); setActiveWordIndex(0); setColorMessage(''); interact(); }}>Ikut perkataan</button>
          </div>
          {colorMode === 'multi' && <div className="word-color-picker">
            <small>Tekan perkataan, kemudian pilih warna · maks. 3 warna</small>
            <div>{wordTokens.map((token) => {
              const wordColor = getWordColor(token.wordIndex);
              return <button type="button" key={`${token.value}-${token.wordIndex}`} className={activeWordIndex === token.wordIndex ? 'active' : ''} onClick={() => { setActiveWordIndex(token.wordIndex); setColorMessage(''); }} style={{ '--word-color': wordColor.value }}><i />{token.value}</button>;
            })}</div>
          </div>}
          <div className="color-options" role="radiogroup">{colors.map((color) => <button key={color.id} className={activeColorId === color.id ? 'selected' : ''} style={{ '--swatch': color.value }} onClick={() => chooseColor(color.id)} aria-label={colorMode === 'multi' ? `${color.label} untuk ${wordTokens[activeWordIndex]?.value || 'perkataan'}` : color.label} role="radio" aria-checked={activeColorId === color.id} />)}</div>
          {colorMessage && <p className="color-message" role="status">{colorMessage}</p>}
        </div>
        <div className={`preview-stage classic-preview-stage ${sizeGuide ? 'classic-sized-preview' : ''}`}>
          <a className="classic-preview-results-link" href="#classic-playground-results" onClick={(event) => {
            const target = document.getElementById('classic-playground-results');
            if (!target) return;
            event.preventDefault();
            target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
            window.history.replaceState(null, '', '#classic-playground-results');
          }}>Lihat gambar sebenar <span aria-hidden="true">↓</span></a>
            <img className="preview-wall" src="/assets/configurator-wall-branded.png" alt="Preview neon pada dinding sebelum ditempah" />
            <div className="classic-preview-artwork" ref={previewStageRef}>
            {colorMode === 'single'
              ? <div className="neon-text" data-text={displayText} style={{ '--neon': selectedColor.value, '--glow': selectedColor.glow, fontFamily: selectedFont.family, fontSize: `${previewFontSize}px`, lineHeight: 1 }}>{displayText}</div>
              : <div className="neon-text multi-color" style={{ fontFamily: selectedFont.family, fontSize: `${previewFontSize}px`, lineHeight: 1 }}>{previewTokens.map((token, index) => {
                if (token.type === 'space') return token.value;
                const wordColor = getWordColor(token.wordIndex);
                return <span className="neon-word" key={`${token.value}-${index}`} data-text={token.value} style={{ '--neon': wordColor.value, '--glow': wordColor.glow }}>{token.value}</span>;
              })}</div>}
            </div>
            <ClassicSizeGuides guide={sizeGuide} />
            {!text.trim() && <span className="preview-hint">Taip untuk mula lihat hasil</span>}
        </div>
      </div>
      <div className="live-summary" aria-live="polite">
        <div><span>Pilihan anda</span><strong>{selectedPackage.name}</strong></div>
        <div className="summary-price"><span>{selectedPackage.price ? 'Harga tetap' : selectedPackage.estimatedPrice ? 'Anggaran harga penuh' : 'Harga'}</span><strong>{selectedPackage.price ? `RM${selectedPackage.price}` : selectedPackage.estimatedPrice ? `RM${selectedPackage.estimatedPrice}*` : '—'}</strong>{selectedPackage.estimatedPrice && <small>Deposit komitmen RM100 · Kami hubungi melalui WhatsApp</small>}</div>
        <a className={`order-button ${!characterCount ? 'disabled' : ''}`} href={checkoutUrl} onClick={prepareCheckout}><ShoppingBagOpen weight="fill" /> Tempah Sekarang</a>
      </div>
      <a className="testimonial-jump" href="#testimoni">Lihat Apa Kata Pelanggan Kami <ArrowDown weight="bold" /></a>
    </section>

    <ClassicComparison />

    <section className="pricing" id="harga">
      <div className="section-intro"><p className="eyebrow"><Palette weight="fill" /> Tiga cara untuk mula</p><h2>Pilih pakej siap<br /><em>atau design custom.</em></h2><p>Sehingga 8 huruf RM150. Untuk 9–15 huruf, harga meningkat secara beransur mengikut bilangan huruf sehingga RM200. Teks, font dan warna ikut pilihan anda dalam configurator.</p></div>
      <div className="price-list">
        <article className={selectedPackage.tier === 'basic' ? 'active' : ''}><span className="package-number">01</span><div><p>Ikut configurator · panjang bawah 60 cm</p><h3>Sehingga 8 huruf</h3></div><strong>RM150</strong><a href="#playground">Cuba pakej ini <ArrowRight /></a></article>
        <article className={selectedPackage.tier === 'plus' ? 'active' : ''}><span className="package-number">02</span><div><h3>9–15 huruf</h3><p>Saiz 60–85 cm</p></div><strong className="classic-price-range">RM150–RM200</strong><a href="#playground">Cuba pakej ini <ArrowRight /></a></article>
        <article className="custom-package"><span className="package-number">03</span><div><p>Deposit design sahaja</p><h3>Custom size & design</h3></div><strong>RM100</strong><a href="/checkout" onClick={prepareCustomCheckout}>Tempah design custom <ArrowRight /></a></article>
      </div>
    </section>

    <section className="package-includes" id="dalam-pakej" aria-labelledby="package-includes-title">
      <div className="package-includes-grid">
        <figure className="package-includes-visual"><img src="/assets/package-includes.jfif" alt="Custom neon LED bersama power adapter, black PVC dan mounting set" loading="lazy" /></figure>
        <div className="package-includes-copy">
          <h2 id="package-includes-title">Apa yang anda dapat<br /><em>bila dah beli.</em></h2>
        </div>
      </div>
    </section>

    <section className="inspiration" id="inspirasi">
      <div className="section-intro light"><p className="eyebrow">Hasil sebenar pelanggan</p><h2>Bukan gambar AI.<br /><em>Ini neon yang dah siap.</em></h2><p>Contoh sebenar daripada tempahan pelanggan—diambil dalam keadaan dan lokasi sebenar.</p></div>
      <ClassicCustomerSlider />
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

    <section className="faq" id="faq"><div className="section-intro light"><p className="eyebrow">Soalan biasa</p><h2>Sebelum neon anda<br /><em>mula menyala.</em></h2></div><div className="faq-list"><details><summary>Bagaimana harga 8 hingga 15 huruf dikira?</summary><p>Sehingga 8 huruf ialah RM150. Bagi 9–15 huruf, beza RM50 dibahagikan sama rata kepada 7 huruf tambahan dan jumlah dibundarkan ke ringgit terdekat. Contoh: 9 huruf RM157, 10 huruf RM164 dan 15 huruf RM200. Teks, font dan warna ikut configurator; panjang bawah 60 cm untuk 1–8 huruf dan bawah 85 cm untuk 9–15 huruf.</p></details><details><summary>Bagaimana huruf dikira?</summary><p>Huruf, nombor, tanda baca dan simbol dikira. Ruang serta line break tidak dikira.</p></details><details><summary>Kalau teks lebih 15 huruf?</summary><p>Configurator akan memaparkan harga anggaran yang hampir 90% tepat. Anda hanya membayar deposit RM100 semasa checkout; kami akan menghubungi anda melalui WhatsApp untuk mengesahkan harga dan ukuran yang tepat.</p></details><details><summary>Apakah maksud deposit Design Custom RM100?</summary><p>RM100 ialah tanda komitmen tempahan bagi teks melebihi 15 huruf, custom size, logo, simbol atau bentuk khas. Selepas bayaran dibuat, kami akan menghubungi anda melalui WhatsApp untuk perbincangan bersama designer. Deposit RM100 akan ditolak daripada harga akhir neon custom.</p></details><details><summary>Boleh digunakan di luar kedai?</summary><p>Tawaran standard ialah untuk indoor. Permintaan outdoor memerlukan semakan bahan dan quotation manual melalui WhatsApp.</p></details><details><summary>Adakah pemasangan dan penghantaran termasuk?</summary><p>Pemasangan tidak termasuk. Caj penghantaran standard ialah RM20 dan dibayar oleh penerima apabila barang dihantar, kecuali jika voucher Free Shipping aktif.</p></details></div></section>
    <footer><div className="brand footer-brand"><span>PAKAR LED &amp; NEON</span><i>BY YH</i></div><p>Jangan biar kedai anda tenggelam bila malam.</p><a href="#playground">Cuba nama kedai anda <ArrowRight /></a></footer>
    <div className="mobile-sticky"><div><small>{characterCount ? (selectedPackage.estimatedPrice ? `Anggaran RM${selectedPackage.estimatedPrice}` : selectedPackage.name) : 'Mulakan tempahan'}</small><strong>{characterCount ? (selectedPackage.price ? `RM${selectedPackage.price}` : 'Deposit RM100') : 'Masukkan nama anda'}</strong></div><a className={!characterCount ? 'needs-name' : ''} href={characterCount ? checkoutUrl : '#shop-name'} onClick={handleMobileOrderClick}><ShoppingBagOpen weight="fill" /> Tempah Sekarang</a></div>
  </main>;
}
