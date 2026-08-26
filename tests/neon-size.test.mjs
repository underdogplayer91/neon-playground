import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateNeonDimensions } from '../src/neonText.js';

test('estimates each character at 5–6 cm and each space at 2 cm', () => {
  assert.deepEqual(estimateNeonDimensions('ABC DE'), {
    minLength: 27,
    maxLength: 32,
    minHeight: 10,
    maxHeight: 20,
  });
});

test('uses the longest line for a multiline neon design', () => {
  assert.deepEqual(estimateNeonDimensions('AB\nC DEF'), {
    minLength: 22,
    maxLength: 26,
    minHeight: 10,
    maxHeight: 20,
  });
});
