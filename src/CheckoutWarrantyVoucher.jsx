import { useEffect, useRef, useState } from 'react';

export function CheckoutWarrantyVoucher({ claimed, onClaim }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const dismiss = (event) => {
      if (event.type === 'keydown' && event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      } else if (event.type === 'pointerdown' && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('keydown', dismiss);
    document.addEventListener('pointerdown', dismiss);
    return () => {
      document.removeEventListener('keydown', dismiss);
      document.removeEventListener('pointerdown', dismiss);
    };
  }, [open]);
  return <div className={`checkout-warranty-voucher ${open ? 'is-open' : ''} ${claimed ? 'is-claimed' : ''}`} ref={root}>
    {open && <section className="warranty-voucher-reveal" id="checkout-warranty-offer" aria-labelledby="warranty-voucher-title">
      <button type="button" className="warranty-voucher-close" aria-label="Tutup voucher" onClick={() => { setOpen(false); trigger.current?.focus(); }}>×</button>
      <span className="warranty-voucher-kicker">Voucher percuma</span>
      <h2 id="warranty-voucher-title">Extended Warranty</h2>
      <strong className="warranty-voucher-months">6 bulan</strong>
      <p>Jumlah warranty 6 bulan untuk tempahan ini.</p>
      {claimed ? <p className="warranty-voucher-success" role="status">Berjaya claim! Warranty 6 bulan ditambah pada tempahan anda.</p>
        : <button type="button" className="warranty-voucher-claim" onClick={onClaim}>Claim Warranty 6 Bulan</button>}
    </section>}
    <button type="button" className="warranty-voucher-trigger" ref={trigger} aria-expanded={open} aria-controls={open ? 'checkout-warranty-offer' : undefined} onClick={() => setOpen((current) => !current)}>
      {claimed ? 'Warranty 6 bulan diclaim' : 'Claim Voucher'} <span aria-hidden="true">{open ? '↓' : '↑'}</span>
    </button>
  </div>;
}
