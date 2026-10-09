export function ClassicSizeGuides({ guide }) {
  if (!guide) return null;
  return <div className="classic-size-guides" role="group" aria-label="Panduan saiz pakej, bukan ukuran design sebenar">
    <div className="classic-height-guide"><span>{`${guide.minHeightCm}–${guide.maxHeightCm} cm`}</span></div>
    <div className="classic-width-guide"><span>{guide.widthCm === 85 ? '60–85 cm' : `Hingga ${guide.widthCm} cm`}</span></div>
    <small className="classic-size-note">Panduan saiz pakej</small>
  </div>;
}
