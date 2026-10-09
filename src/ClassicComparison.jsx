import { useState } from 'react';
import media from './classicComparisonMedia.json';
import './classicComparison.css';

export function ClassicComparison() {
  const [reveal, setReveal] = useState(50);

  return <section className="classic-comparison" id="classic-playground-results" aria-labelledby="classic-comparison-title">
    <div className="section-intro light">
      <p className="eyebrow">Daripada preview kepada neon sebenar</p>
      <h2 id="classic-comparison-title">Tarik untuk lihat<br /><em>hasil yang dah siap.</em></h2>
      <p>Setiap pasangan di bawah ialah design Playground dan hasil neon sebenar daripada tempahan yang sama.</p>
    </div>
    <div className="comparison-stage" style={{ '--reality-reveal': `${reveal}%` }}>
      <div className="comparison-side-label preview-label">Playground</div>
      <div className="comparison-side-label real-label">Hasil sebenar</div>
      <div className="comparison-collage preview-collage">
        {media.pairs.map((item) => <figure key={item.slug} className={item.className}>
          <img src={item.preview.src} alt={`Preview Playground untuk ${item.title}`} loading="lazy" decoding="async" draggable={false} />
          <figcaption>{item.title}</figcaption>
        </figure>)}
      </div>
      <div className="comparison-collage real-collage">
        {media.pairs.map((item) => <figure key={item.slug} className={item.className}>
          <img src={item.real.src} alt={`Hasil neon sebenar untuk ${item.title}`} loading="lazy" decoding="async" draggable={false} />
          <figcaption aria-hidden="true">{item.title}</figcaption>
        </figure>)}
      </div>
      <div className="comparison-divider" aria-hidden="true"><span>↔</span></div>
      <input className="comparison-range" type="range" min="0" max="100" step="1" value={reveal}
        onChange={(event) => setReveal(Number(event.target.value))}
        aria-label="Tarik untuk bandingkan design Playground dengan hasil sebenar"
        aria-valuetext={`${reveal}% Playground, ${100 - reveal}% hasil sebenar`}
        aria-describedby="classic-comparison-hint" />
    </div>
    <p className="comparison-hint" id="classic-comparison-hint">Sentuh dan tarik garis kiri / kanan untuk lihat perubahan.</p>
  </section>;
}
