import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'vite';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';

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
      } else if (file === 'ClassicPage') {
        assert.match(html, /Sehingga 8 huruf/);
        assert.match(html, /Sehingga 15 huruf/);
        assert.doesNotMatch(html, /Editor susunan perkataan/);
      } else {
        assert.match(html, /Editor susunan perkataan neon/);
        assert.match(html, /REKA NEON ANDA|Reka Neon Anda/);
      }
      const source = readFileSync(`src/${file}.jsx`, 'utf8');
      const media = [...source.matchAll(/['"](\/assets\/[^'"\n]+)['"]/g)].map((match) => match[1]);
      for (const path of media) assert.ok(existsSync(`public${path}`), `Missing ${file} asset: ${path}`);
    }
  } finally { await vite.close(); }
});
