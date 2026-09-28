import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLayerDesign, createTextLayer, layoutAutomaticWords } from '../src/neonLayers.js';

test('typed words use natural automatic spacing until dragged', () => {
  const words = [createTextLayer({ text: 'Pakar' }), createTextLayer({ text: 'Neon' })];
  const positioned = layoutAutomaticWords(words);
  assert.equal(positioned[0].x_cm, 3);
  assert.ok(positioned[1].x_cm > positioned[0].x_cm);
  assert.ok(positioned[1].x_cm - positioned[0].x_cm < 50);
  const firstDesign = calculateLayerDesign([words[0]]);
  const actualGap = positioned[1].x_cm - positioned[0].x_cm - firstDesign.designWidthCm;
  assert.ok(actualGap >= 2.5 && actualGap <= 3.5);
  const dragged = layoutAutomaticWords([{ ...words[0], detached: true, x_cm: 42, y_cm: 18 }, words[1]]);
  assert.equal(dragged[0].x_cm, 42);
  assert.equal(dragged[0].y_cm, 18);
});

test('typed line breaks are preserved until a word is dragged', () => {
  const words = [
    createTextLayer({ text: 'Setiap', line_index: 0 }),
    createTextLayer({ text: 'perkataan', line_index: 0 }),
    createTextLayer({ text: 'boleh', line_index: 1 }),
    createTextLayer({ text: 'pilih', line_index: 1 }),
  ];
  const positioned = layoutAutomaticWords(words);
  assert.equal(positioned[0].y_cm, positioned[1].y_cm);
  assert.ok(positioned[2].y_cm > positioned[0].y_cm);
  assert.equal(positioned[2].y_cm, positioned[3].y_cm);
  assert.equal(positioned[0].x_cm, positioned[2].x_cm);
  const dragged = layoutAutomaticWords(words.map((word, index) => index === 2 ? { ...word, detached: true, x_cm: 50, y_cm: 40 } : word));
  assert.equal(dragged[2].x_cm, 50);
  assert.equal(dragged[2].y_cm, 40);
});

test('combined design uses all visible positioned layer bounds plus 6 cm', () => {
  const first = createTextLayer({ id: 'a', text: 'Pakar', x_cm: 3, y_cm: 3 });
  const second = createTextLayer({ id: 'b', text: 'Neon', x_cm: 35, y_cm: 22 });
  const design = calculateLayerDesign([first, second]);
  assert.equal(design.complete, true);
  assert.equal(design.backboardWidthCm, design.designWidthCm + 6);
  assert.equal(design.backboardHeightCm, design.designHeightCm + 6);
});

test('hidden layers do not expand combined bounds', () => {
  const visible = createTextLayer({ id: 'a', text: 'Pakar', x_cm: 3, y_cm: 3 });
  const hidden = createTextLayer({ id: 'b', text: 'Neon', x_cm: 200, y_cm: 200, visible: false });
  const withHidden = calculateLayerDesign([visible, hidden]);
  const alone = calculateLayerDesign([visible]);
  assert.equal(withHidden.designWidthCm, alone.designWidthCm);
  assert.equal(withHidden.designHeightCm, alone.designHeightCm);
});

test('overlapping layer bounds produce a DFM warning', () => {
  const first = createTextLayer({ id: 'a', text: 'Pakar', x_cm: 3, y_cm: 3 });
  const second = createTextLayer({ id: 'b', text: 'Neon', x_cm: 4, y_cm: 4 });
  const design = calculateLayerDesign([first, second]);
  assert.ok(design.overlaps.length > 0);
  assert.ok(design.warnings.some((warning) => warning.includes('bertindih')));
});

test('rotating a word expands its combined axis-aligned bounds', () => {
  const plain = calculateLayerDesign([createTextLayer({ id: 'a', text: 'Pakar', rotation_deg: 0 })]);
  const rotated = calculateLayerDesign([createTextLayer({ id: 'a', text: 'Pakar', rotation_deg: 45 })]);
  assert.ok(rotated.designHeightCm > plain.designHeightCm);
});

