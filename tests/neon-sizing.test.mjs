import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateNeonSize, neonRules, sizingFonts } from '../src/neonSizing.js';

test('database exposes only fonts with matching local font files', () => {
  assert.equal(sizingFonts.length, 58);
  assert.equal(sizingFonts.some((font) => font.name === 'Olivia'), false);
  assert.equal(sizingFonts.some((font) => font.name === 'League Spartan Regular'), false);
});

test('new double-line font measurements are available without replacing existing fonts', () => {
  assert.equal(sizingFonts.some((font) => font.id === 'neonglow-cn'), true);
  assert.equal(sizingFonts.some((font) => font.id === 'empire-outline'), true);
  const result = calculateNeonSize({ text: 'Neon', fontId: 'neonglow-cn', targetTextHeightCm: 15 });
  assert.equal(result.complete, true);
  assert.equal(result.scaleFactor, 15 / 1497);
  assert.ok(result.visualTextWidthCm > 0);
});

test('Pakar uses one scale factor and its real mixed-case bounds', () => {
  const result = calculateNeonSize({
    text: 'Pakar',
    fontId: 'beachfront-cn',
    targetTextHeightCm: 15,
    letterSpacingCm: 0,
  });
  assert.equal(result.complete, true);
  assert.ok(result.visualTextWidthCm > 0);
  assert.ok(result.visualTextHeightCm > 0);
  assert.ok(result.visualTextHeightCm < 20);
  assert.ok(Math.abs(result.scaleFactor - (15 / 1199.882353)) < 1e-9);
});

test('signed kerning changes advance width', () => {
  const kerned = calculateNeonSize({ text: 'AV', fontId: 'league-spartan-regular', targetTextHeightCm: 10, letterSpacingCm: 0 });
  const spaced = calculateNeonSize({ text: 'AV', fontId: 'league-spartan-regular', targetTextHeightCm: 10, letterSpacingCm: 1 });
  assert.equal(kerned.kerningUnitsTotal, -144);
  assert.ok(spaced.textWidthCm > kerned.textWidthCm);
});

test('backboard adds padding on all sides', () => {
  const result = calculateNeonSize({ text: 'Pakar', fontId: 'beachfront-cn', targetTextHeightCm: 15 });
  assert.equal(result.backboardWidthCm, Number((result.visualTextWidthCm + neonRules.backboard_padding_cm * 2).toFixed(1)));
  assert.equal(result.backboardHeightCm, Number((result.visualTextHeightCm + neonRules.backboard_padding_cm * 2).toFixed(1)));
});

test('unsupported characters prevent a complete measurement', () => {
  const result = calculateNeonSize({ text: 'Neon ♥', fontId: 'beachfront-cn', targetTextHeightCm: 15 });
  assert.equal(result.complete, false);
  assert.deepEqual(result.unsupportedCharacters, ['♥']);
});
