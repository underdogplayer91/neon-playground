import { useRef, useState } from 'react';
import media from './classicCustomerMedia.json';

export function ClassicCustomerSlider() {
  const trackRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const lastSlide = media.images.length - 1;
  const goToSlide = (index) => {
    const track = trackRef.current;
    if (!track) return;
    const next = Math.max(0, Math.min(lastSlide, index));
    track.scrollTo({
      left: next * track.clientWidth,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  };

  return <div className="classic-customer-slider" role="region" aria-roledescription="carousel" aria-label="Hasil sebenar pelanggan">
    <div
      className="classic-customer-track"
      id="classic-customer-track"
      ref={trackRef}
      tabIndex={0}
      aria-label="Gambar pelanggan — gunakan anak panah kiri atau kanan"
      aria-describedby="classic-customer-hint"
      onScroll={(event) => {
        const track = event.currentTarget;
        if (track.clientWidth) setActiveSlide(Math.max(0, Math.min(lastSlide, Math.round(track.scrollLeft / track.clientWidth))));
      }}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        goToSlide(activeSlide + (event.key === 'ArrowRight' ? 1 : -1));
      }}
    >
      {media.images.map((item, index) => <figure key={item.id} role="group" aria-roledescription="slide" aria-label={`${index + 1} daripada ${media.images.length}`}>
        <img src={item.src} alt={`Hasil neon sebenar pelanggan ${index + 1}`} loading="lazy" decoding="async" draggable={false} />
      </figure>)}
    </div>
    <div className="classic-customer-controls">
      <button type="button" aria-label="Gambar pelanggan sebelumnya" aria-controls="classic-customer-track" disabled={activeSlide === 0} onClick={() => goToSlide(activeSlide - 1)}>←</button>
      <span role="status" aria-live="polite">{String(activeSlide + 1).padStart(2, '0')} / {String(media.images.length).padStart(2, '0')}</span>
      <button type="button" aria-label="Gambar pelanggan seterusnya" aria-controls="classic-customer-track" disabled={activeSlide === lastSlide} onClick={() => goToSlide(activeSlide + 1)}>→</button>
    </div>
    <p id="classic-customer-hint" className="classic-customer-hint">Swipe ke kiri / kanan atau tekan anak panah untuk lihat gambar.</p>
  </div>;
}
