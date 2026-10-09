import { ArrowDownIcon } from '@phosphor-icons/react/dist/csr/ArrowDown';
import { CameraIcon } from '@phosphor-icons/react/dist/csr/Camera';
import { SparkleIcon } from '@phosphor-icons/react/dist/csr/Sparkle';
import { StarIcon } from '@phosphor-icons/react/dist/csr/Star';
import media from './classicHeroMedia.json';
import './classicBusinessHero.css';

export function ClassicBusinessHero() {
  return <>
    <section className="classic-business-hero" aria-labelledby="classic-business-title">
      <div className="classic-business-photos">
        <img className="classic-business-collection" src={media.collection.src} width="1061" height="623" alt="Hasil neon sebenar: RINGO, Jas kitchen, BIENZ dan Chicken Rice & Wantan Mee" fetchPriority="high" />
        <div className="classic-business-bbq"><img src={media.bbq.src} width="2304" height="4096" alt="Neon sebenar PITBOYBBQ dengan tulisan SMOKIN’ GOOD" /></div>
      </div>
      <div className="classic-business-gradient" aria-hidden="true" />
      <div className="classic-business-copy">
        <p className="eyebrow">Neon khas untuk bisnes anda</p>
        <h1 id="classic-business-title">Bisnes anda<br />ada nama.<br />Biar orang<br /><em>nampak.</em></h1>
        <p className="classic-business-description">Dari nama kedai hingga logo pilihan anda—jadikan ruang bisnes lebih menyerlah dengan Custom Neon LED.</p>
        <a className="primary-button" href="#playground">Cuba Nama Kedai Anda <ArrowDownIcon size={27} weight="bold" aria-hidden="true" /></a>
        <p className="classic-business-note">Reka · Sahkan · Baru kami hasilkan</p>
      </div>
      <figure className="classic-business-proof">
        <figcaption>Apa pelanggan kami cakap</figcaption>
        <a href={media.testimonial.src} target="_blank" rel="noreferrer" aria-label="Besarkan screenshot WhatsApp asal Daisy Coffee">
          <img src={media.testimonial.src} width="571" height="1280" alt="Conversation WhatsApp asal Daisy Coffee bersama gambar neon: Salam barang dh sampai, Terima kasih banyak ye dan Cantik sangat hasil kerja!" />
        </a>
      </figure>
    </section>
    <section className="classic-business-benefits" aria-label="Neon untuk identiti bisnes">
      <div><SparkleIcon size={34} aria-hidden="true" /><span>Nama lebih menyerlah</span></div>
      <div><StarIcon size={34} aria-hidden="true" /><span>Identiti yang diingati</span></div>
      <div><CameraIcon size={34} aria-hidden="true" /><span>Ruang jadi photo spot</span></div>
    </section>
  </>;
}
