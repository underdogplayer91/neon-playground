import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'vite';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import classicMedia from '../src/classicCustomerMedia.json' with { type: 'json' };
import comparisonMedia from '../src/classicComparisonMedia.json' with { type: 'json' };
import { getClassicSizeGuide } from '../src/classicSizing.js';

test('all landing pages render, preserve their distinct UI and refer to existing media', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', ssr: { external: ['react', 'react-dom'] } });
  try {
    for (const [file, exportName] of [['HomePage', 'HomePage'], ['ClassicPage', 'ClassicPage'], ['App', 'App']]) {
      const page = await vite.ssrLoadModule(`/src/${file}.jsx`);
      const html = renderToString(createElement(page[exportName]));
      assert.match(html, /PAKAR LED/);
      if (file === 'HomePage') {
        assert.doesNotMatch(html, /<textarea|Editor susunan perkataan|configurator-wall/);
        assert.match(html, /Reka Tulisan Sendiri/);
        assert.match(html, /Ada Logo \/ Design Custom/);
        assert.match(html, /href="\/playground"/);
        assert.match(html, /rotating-customer-poster/);
        assert.match(html, /class="hero"/);
        assert.match(html, /class="benefit-strip"/);
        assert.match(html, /class="home-playground-float" href="\/playground">Neon Playground/);
      } else if (file === 'ClassicPage') {
        assert.doesNotMatch(html, /home-playground-float/);
        assert.match(html, /Sehingga 8 huruf/);
        const plusCard = html.match(/<article[^>]*><span class="package-number">02<\/span>[\s\S]*?<\/article>/)?.[0];
        assert.ok(plusCard);
        assert.match(plusCard, /<h3>9–15 huruf<\/h3>/);
        assert.match(plusCard, /Saiz 60–85 cm/);
        assert.match(plusCard, /RM150–RM200/);
        assert.doesNotMatch(plusCard, /Sehingga 15 huruf|Harga ikut bilangan huruf|RM157/);
        assert.doesNotMatch(html, /class="pricing-clarity"/);
        assert.match(html, /9 huruf RM157/);
        assert.match(html, /10 huruf RM164/);
        assert.doesNotMatch(html, /Adakah RM150 dan RM200 ikut rekaan configurator/);
        assert.match(html, /class="hero"/);
        assert.doesNotMatch(html, /Editor susunan perkataan/);
        assert.match(html, /class="classic-customer-track"/);
        assert.match(html, /Bukan gambar AI/);
        assert.doesNotMatch(html, /class="real-gallery"|class="type-poster"|class="poster-slideshow"/);
        assert.equal((html.match(/aria-roledescription="slide"/g) || []).length, classicMedia.images.length);
        assert.match(html, /aria-label="Gambar pelanggan sebelumnya"[^>]*disabled/);
        assert.match(html, /aria-label="Gambar pelanggan seterusnya"/);
        assert.match(html, /id="classic-playground-results"/);
        assert.doesNotMatch(html, /class="mode-toggle"|real-result-slides|Jenis paparan/);
        assert.match(html, /class="classic-preview-results-link" href="#classic-playground-results">Lihat gambar sebenar/);
        assert.match(html, /class="preview-wall"/);
        assert.match(html, /class="classic-preview-artwork"/);
        assert.doesNotMatch(html, /class="classic-size-guides"/);
        assert.match(html, /class="comparison-stage" style="--reality-reveal:50%"/);
        assert.match(html, /class="comparison-range" type="range" min="0" max="100" step="1"/);
        for (const item of comparisonMedia.pairs) {
          assert.ok(html.includes(`src="${item.preview.src}"`));
          assert.ok(html.includes(`src="${item.real.src}"`));
        }
      } else {
        assert.doesNotMatch(html, /home-playground-float/);
        assert.match(html, /Editor susunan perkataan neon/);
        assert.match(html, /REKA NEON ANDA|Reka Neon Anda/);
        assert.doesNotMatch(html, /class="hero"|class="benefit-strip"|hero-storefront-v2|Untuk bisnes, ruang|Tak lagi tenggelam|Nampak &amp; dikenali|Jadi photo spot/);
        assert.match(html, /<\/header><section class="playground-section" id="playground">/);
        assert.doesNotMatch(html, /Perlukan rekaan khas|Minta kami hubungi|rotating-customer-poster|customer-poster|Ada logo sendiri|Semua melalui WhatsApp/);
        assert.match(html, /id="playground-results"/);
        assert.match(html, /href="#playground-results"/);
      }
      const source = readFileSync(`src/${file}.jsx`, 'utf8');
      const media = [...source.matchAll(/['"](\/assets\/[^'"\n]+)['"]/g)].map((match) => match[1]);
      for (const path of media) assert.ok(existsSync(`public${path}`), `Missing ${file} asset: ${path}`);
    }
  } finally { await vite.close(); }
});

test('Classic size guide renders both dimension lines as package ranges and nothing for hidden states', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', ssr: { external: ['react', 'react-dom'] } });
  try {
    const { ClassicSizeGuides } = await vite.ssrLoadModule('/src/ClassicSizeGuides.jsx');
    for (const [text, width, height] of [['ABCDEFGH', 'Hingga 60 cm', '15–20'], ['ABCDEFGHI', '60–85 cm', '15–20'], ['ABCDEFGHIJKLMNO', '60–85 cm', '15–20'], ['ABCD\nEFGH', 'Hingga 60 cm', '20–25'], ['ABCDEFGH\nIJKLMNO', '60–85 cm', '20–25']]) {
      const html = renderToString(createElement(ClassicSizeGuides, { guide: getClassicSizeGuide(text) }));
      assert.match(html, /classic-height-guide/);
      assert.match(html, /classic-width-guide/);
      assert.ok(html.includes(width));
      assert.ok(!html.includes('Hingga 85 cm'));
      assert.ok(html.includes(height));
      assert.match(html, /bukan ukuran design sebenar/);
    }
    for (const text of ['', 'ABC\nDEF\nGHI', 'A'.repeat(16)]) {
      assert.equal(renderToString(createElement(ClassicSizeGuides, { guide: getClassicSizeGuide(text) })), '');
    }
    const css = readFileSync('src/classic.css', 'utf8');
    assert.match(css, /\.classic-sized-preview \.classic-preview-artwork\{inset:74px 24px 90px 64px\}/);
  } finally { await vite.close(); }
});

test('checkout labels, package contents and voucher preserve the deposit and measured-size meanings', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', ssr: { external: ['react', 'react-dom'] } });
  const previousWindow = globalThis.window;
  try {
    const { CheckoutPage } = await vite.ssrLoadModule('/src/CheckoutPage.jsx');
    for (const [order, size, total] of [
      [{ pricingModel: 'classic-package', text: 'ABCDEFGHIJ', price: 164, tier: 'plus' }, '≤ 85cm', 'Total Harga'],
      [{ pricingModel: 'classic-package', text: 'ABCDEFGH', price: 150, tier: 'basic', warrantyVoucherClaimed: true }, '≤ 60cm', 'Total Harga'],
      [{ pricingModel: 'measured', text: 'Kopi', price: 100, estimatedPrice: 400, tier: 'custom', sizeNote: '75 × 30 cm' }, '75 × 30 cm', 'Harga deposit'],
    ]) {
      globalThis.window = { sessionStorage: { getItem: () => JSON.stringify(order) } };
      const html = renderToString(createElement(CheckoutPage));
      assert.ok(html.includes(size));
      assert.ok(html.includes(total));
      assert.match(html, /Pakej Included Neon \+ Power Supply \+ Bracket/);
      assert.match(html, /checkout-warranty-voucher/);
      assert.match(html, order.warrantyVoucherClaimed ? /Warranty 6 bulan diclaim/ : /Claim Voucher/);
      assert.doesNotMatch(html, /Jumlah dibayar sekarang|shipping-voucher-overlay|shipping-voucher-countdown/);
    }
    globalThis.window = { sessionStorage: { getItem: () => null } };
    assert.doesNotMatch(renderToString(createElement(CheckoutPage)), /checkout-warranty-voucher/);
  } finally {
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
    await vite.close();
  }
});

test('Classic slider uses every approved Drive image as a valid local JPEG with its source recorded', () => {
  assert.equal(classicMedia.folderId, '11MAraPh6YXEcAgzu1eCT_TXkdQDusGTb');
  assert.equal(classicMedia.images.length, 15);
  assert.equal(new Set(classicMedia.images.map((item) => item.id)).size, 15);
  for (const item of classicMedia.images) {
    const bytes = readFileSync(`public${item.src}`);
    assert.equal(bytes.length, item.bytes, `Incomplete asset: ${item.name}`);
    assert.equal(bytes[0], 0xff);
    assert.equal(bytes[1], 0xd8);
    // Camera JPEGs may include extra metadata after the image's end marker.
    assert.ok(bytes.lastIndexOf(Buffer.from([0xff, 0xd9])) > 2, `Missing JPEG end marker: ${item.name}`);
  }
  const css = readFileSync('src/classic.css', 'utf8');
  assert.match(css, /\.classic-customer-track\{[^}]*overflow-x:auto[^}]*scroll-snap-type:x mandatory/);
  assert.match(css, /\.classic-customer-track img\{[^}]*object-fit:contain/);
});

test('Classic comparison includes exactly the seven selected folders and fourteen intact matched assets', () => {
  assert.equal(comparisonMedia.folderId, '1rT_pD9DKKSz3vkTzp5ecjMfyHBhSMyk7');
  assert.deepEqual(comparisonMedia.pairs.map((item) => item.title).sort(), [
    'Michael Jackson', 'Haikal Feroz', 'Adys Resort', 'Burger Kakza', 'Minty Cofftea', 'Nasi Lemak Utara', 'Feel the difference',
  ].sort());
  assert.deepEqual(comparisonMedia.pairs.slice(0, 2).map((item) => item.slug), ['adys', 'burger-kakza']);
  const ids = [];
  for (const item of comparisonMedia.pairs) {
    for (const side of ['preview', 'real']) {
      const image = item[side];
      assert.equal(image.side, side);
      assert.equal(image.folderId, item.folderId);
      assert.equal(image.slug, item.slug);
      ids.push(image.id);
      const bytes = readFileSync(`public${image.src}`);
      assert.equal(bytes.length, image.bytes, `Incomplete ${item.title} ${side}`);
      if (image.mimeType === 'image/png') assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      else assert.equal(bytes.subarray(0, 2).toString('hex'), 'ffd8');
    }
  }
  assert.equal(new Set(ids).size, 14);
  const desktopCells = comparisonMedia.pairs.reduce((sum, item) => sum + (item.className ? 2 : 1), 0);
  const mobileCells = comparisonMedia.pairs.reduce((sum, item) => sum + (item.className === 'wide' ? 2 : 1), 0);
  assert.equal(desktopCells, 9);
  assert.equal(mobileCells, 8);
  const css = readFileSync('src/classicComparison.css', 'utf8');
  assert.match(css, /clip-path:inset\(0 0 0 var\(--reality-reveal\)\)/);
  assert.match(css, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});
