import { useEffect, useState } from 'react';
import { getMetaAttribution, trackMetaEventOnce } from './metaPixel';
import './styles.css';
const EmptyIcon = () => null;
const MapPin = EmptyIcon, ArrowDown = EmptyIcon, ArrowRight = EmptyIcon, Check = EmptyIcon, Eye = EmptyIcon, Heart = EmptyIcon, InstagramLogo = EmptyIcon;
const posterSlides = Array.from({ length: 36 }, (_, index) => ({
  src: `/assets/customer-poster/poster-${String(index + 1).padStart(2, '0')}.jpg`,
  alt: `Hasil neon sebenar pelanggan ${index + 1}`,
}));
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

export function HomePage() {
  const [activeTestimonial, setActiveTestimonial] = useState(3);
  const [activePosterSlide, setActivePosterSlide] = useState(0);
  const [isCustomLeadOpen, setIsCustomLeadOpen] = useState(false);
  const [customLead, setCustomLead] = useState({ name: '', phone: '', companyWebsite: '' });
  const [customLeadState, setCustomLeadState] = useState({ status: 'idle', message: '' });
  useEffect(() => {
    trackMetaEventOnce('view-content:home', 'ViewContent', { content_name: 'Pakar LED & Neon', landing_source: 'home' });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setActivePosterSlide((value) => (value + 1) % posterSlides.length), 3600);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!isCustomLeadOpen) return undefined;
    const previous = document.body.style.overflow;
    const close = (event) => { if (event.key === 'Escape' && customLeadState.status !== 'sending') setIsCustomLeadOpen(false); };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', close);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', close); };
  }, [isCustomLeadOpen, customLeadState.status]);
  const openCustomLead = () => {
    setCustomLeadState({ status: 'idle', message: '' });
    setIsCustomLeadOpen(true);
  };
  const closeCustomLead = () => {
    if (customLeadState.status !== 'sending') setIsCustomLeadOpen(false);
  };
  const updateCustomLead = (event) => setCustomLead((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submitCustomLead = async (event) => {
    event.preventDefault();
    if (customLeadState.status === 'sending') return;
    setCustomLeadState({ status: 'sending', message: '' });
    try {
      const response = await fetch('/api/custom-logo-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...customLead, landingSource: 'home', tracking: getMetaAttribution() }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'Permintaan tidak dapat dihantar.');
      trackMetaEventOnce(`lead:home:${Date.now()}`, 'Lead', { content_name: 'Design Custom', landing_source: 'home' });
      setCustomLeadState({ status: 'sent', message: 'Permintaan sudah dihantar. Kami akan hubungi anda melalui WhatsApp.' });
      setCustomLead({ name: '', phone: '', companyWebsite: '' });
    } catch (error) {
      setCustomLeadState({ status: 'error', message: error.message || 'Permintaan tidak dapat dihantar. Sila cuba semula.' });
    }
  };

  return <main id="top" className="home-page">
    <header className="site-header">
      <a className="brand" href="/"><span>PAKAR LED &amp; NEON</span><i>BY YH</i></a>
      <nav><a href="/playground">Reka Tulisan</a><a href="#inspirasi">Hasil Pelanggan</a><a href="#faq">FAQ</a></nav>
      <button type="button" className="header-cta" onClick={openCustomLead}>Design Custom</button>
    </header>
    <section className="hero">
      <div className="hero-slides"><img className="active" src={heroImage.src} alt={heroImage.alt} fetchPriority="high" /></div>
      <div className="hero-shade" />
      <div className="hero-content">
        <p className="eyebrow"><MapPin weight="fill" /> Untuk bisnes, ruang &amp; momen anda</p>
        <h1>Dari ruang yang suram<br />kepada suasana yang<br /><em>hidup menyala.</em></h1>
        <p className="hero-copy">Meriahkan kedai, bilik, acara atau studio dengan Custom Neon LED daripada nama dan kata-kata pilihan anda.</p>
        <div className="home-actions"><a className="primary-button" href="/playground">Reka Tulisan Sendiri <ArrowDown weight="bold" /></a><button type="button" className="home-custom-button" onClick={openCustomLead}>Ada Logo / Design Custom</button></div>
        <div className="hero-note"><Check weight="bold" /> Reka · Sahkan · Baru kami hasilkan</div>
      </div>
      <div className="day-label">Siang biasa-biasa.</div><div className="night-label">Malam semua nampak kedai anda.</div>
    </section>

    <section className="benefit-strip">
      <article><span>01</span><Eye /><div><h3>Tak lagi tenggelam</h3><p>Nama kedai lebih jelas bila malam.</p></div></article>
      <article><span>02</span><Heart /><div><h3>Nampak & dikenali</h3><p>Bina identiti yang orang mudah ingat.</p></div></article>
      <article><span>03</span><InstagramLogo /><div><h3>Jadi photo spot</h3><p>Buat pelanggan mahu rakam dan kongsi.</p></div></article>
    </section>


    <section className="inspiration" id="inspirasi">
      <div className="section-intro light"><h2>Hasil customer yang<br /><em>Custom Logo.</em></h2></div>
      <div className="customer-poster-shell">
        <figure className="poster-slideshow rotating-customer-poster" aria-label="Poster berpusing hasil neon sebenar" aria-live="polite">
          {posterSlides.map((slide, index) => <img key={slide.src} className={activePosterSlide === index ? 'active' : ''} src={slide.src} alt={slide.alt} aria-hidden={activePosterSlide !== index} loading="lazy" />)}
          <figcaption><span>Hasil sebenar</span><strong>{String(activePosterSlide + 1).padStart(2, '0')} / {String(posterSlides.length).padStart(2, '0')}</strong><div><button type="button" onClick={() => setActivePosterSlide((activePosterSlide - 1 + posterSlides.length) % posterSlides.length)} aria-label="Poster sebelumnya">←</button><button type="button" onClick={() => setActivePosterSlide((activePosterSlide + 1) % posterSlides.length)} aria-label="Poster seterusnya">→</button></div></figcaption>
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

    <section className="faq" id="faq"><div className="section-intro light"><p className="eyebrow">Soalan biasa</p><h2>Sebelum neon anda<br /><em>mula menyala.</em></h2></div><div className="faq-list"><details><summary>Bagaimana harga tulisan dalam configurator dikira?</summary><p>Harga anggaran berubah mengikut saiz keseluruhan rekaan, font, warna, bahan backboard dan pilihan lain yang dibuat dalam configurator.</p></details><details><summary>Bilakah saya perlu pilih Design Custom?</summary><p>Pilih Design Custom jika anda mempunyai logo sendiri atau memerlukan simbol, bentuk dan ukuran khas yang tidak boleh dibina terus dalam configurator.</p></details><details><summary>Apa berlaku selepas saya pilih Design Custom?</summary><p>Isi nama dan nombor telefon dahulu. Kami akan WhatsApp anda untuk mendapatkan fail logo dan membincangkan saiz, bahan serta harga.</p></details><details><summary>Boleh digunakan di luar kedai?</summary><p>Tawaran standard ialah untuk indoor. Permintaan outdoor memerlukan semakan bahan dan quotation manual melalui WhatsApp.</p></details></div></section>
    <footer><div className="brand footer-brand"><span>PAKAR LED &amp; NEON</span><i>BY YH</i></div><p>Jangan biar kedai anda tenggelam bila malam.</p><a href="/playground">Reka Tulisan Sendiri <ArrowRight /></a></footer>

    {!isCustomLeadOpen && <a className="home-playground-float" href="/playground">Neon Playground <span aria-hidden="true">→</span></a>}

    {isCustomLeadOpen && <div className="custom-lead-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeCustomLead(); }}>
      <section className="custom-lead-modal" role="dialog" aria-modal="true" aria-labelledby="custom-lead-title">
        <button type="button" className="custom-lead-close" onClick={closeCustomLead} aria-label="Tutup borang Custom Logo">×</button>
        {customLeadState.status === 'sent' ? <div className="custom-lead-success" role="status"><span>✓</span><p className="eyebrow">Permintaan diterima</p><h2 id="custom-lead-title">Kami akan WhatsApp anda.</h2><p>{customLeadState.message}</p><button type="button" onClick={closeCustomLead}>Tutup</button></div> : <>
          <p className="eyebrow">Design Custom</p>
          <h2 id="custom-lead-title">Ada logo sendiri?</h2>
          <p className="custom-lead-intro">Tinggalkan nama dan nombor telefon. Kami akan WhatsApp anda untuk dapatkan logo serta bincang saiz, bahan dan harga.</p>
          <form onSubmit={submitCustomLead}>
            <label>Nama penuh<input name="name" value={customLead.name} onChange={updateCustomLead} autoComplete="name" minLength="2" maxLength="100" required autoFocus /></label>
            <label>Nombor telefon<input name="phone" value={customLead.phone} onChange={updateCustomLead} inputMode="tel" autoComplete="tel" placeholder="Contoh: 0123456789" pattern="(?:01[0-9]{8,9}|601[0-9]{8,9})" required /></label>
            <label className="custom-lead-honeypot" aria-hidden="true">Laman syarikat<input name="companyWebsite" value={customLead.companyWebsite} onChange={updateCustomLead} tabIndex="-1" autoComplete="off" /></label>
            {customLeadState.message && <p className="custom-lead-error" role="alert">{customLeadState.message}</p>}
            <button type="submit" className="custom-lead-submit" disabled={customLeadState.status === 'sending'}>{customLeadState.status === 'sending' ? 'Sedang menghantar…' : 'Hantar Permintaan'}</button>
          </form>
        </>}
      </section>
    </div>}

  </main>;
}
