import measurementData from './data/neonFontMeasurements.generated.js';

const GLYPH = {
  advance: 0,
  width: 1,
  height: 2,
  xMin: 3,
  yMin: 4,
  xMax: 5,
  yMax: 6,
  supported: 7,
};

const round = (value, digits = 1) => Number(value.toFixed(digits));

export const neonRules = measurementData.rules;
export const measurementSource = measurementData.source;
export const allMeasurementFonts = measurementData.fonts;
export const sizingFonts = measurementData.fonts.filter((font) => font.available);

export function calculateNeonSize({
  text,
  fontId,
  targetTextHeightCm,
  letterSpacingCm = 0,
  lineHeightRatio = 1.25,
}) {
  const font = measurementData.fonts.find((item) => item.id === fontId);
  const targetHeight = Number(targetTextHeightCm);
  const trackingCm = Number(letterSpacingCm);
  if (!font || !Number.isFinite(targetHeight) || targetHeight <= 0) return null;

  const scaleFactor = targetHeight / font.referenceHeightUnits;
  const letterSpacingUnits = Number.isFinite(trackingCm) ? trackingCm / scaleFactor : 0;
  const fontGlyphs = measurementData.glyphs[fontId] || {};
  const fontKerning = measurementData.kerning[fontId] || {};
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  const unsupportedCharacters = new Set();
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let widestAdvanceUnits = 0;
  let glyphCount = 0;
  let kerningUnitsTotal = 0;
  let letterSpacingUnitsTotal = 0;

  lines.forEach((line, lineIndex) => {
    const characters = [...line];
    let cursorX = 0;
    let previousCharacter = null;
    const baselineY = -lineIndex * font.referenceHeightUnits * lineHeightRatio;

    characters.forEach((character, characterIndex) => {
      const glyph = fontGlyphs[character];
      if (!glyph || !glyph[GLYPH.supported]) {
        unsupportedCharacters.add(character);
        previousCharacter = null;
        return;
      }

      if (previousCharacter !== null) {
        const pairKerning = Number(fontKerning[`${previousCharacter}${character}`] || 0);
        cursorX += pairKerning;
        kerningUnitsTotal += pairKerning;
      }

      minX = Math.min(minX, cursorX + glyph[GLYPH.xMin]);
      maxX = Math.max(maxX, cursorX + glyph[GLYPH.xMax]);
      minY = Math.min(minY, baselineY + glyph[GLYPH.yMin]);
      maxY = Math.max(maxY, baselineY + glyph[GLYPH.yMax]);
      cursorX += glyph[GLYPH.advance];
      glyphCount += 1;

      if (characterIndex < characters.length - 1) {
        cursorX += letterSpacingUnits;
        letterSpacingUnitsTotal += letterSpacingUnits;
      }
      previousCharacter = character;
    });
    widestAdvanceUnits = Math.max(widestAdvanceUnits, cursorX);
  });

  const complete = unsupportedCharacters.size === 0;
  const hasVisualBounds = glyphCount > 0 && Number.isFinite(minX) && Number.isFinite(maxX);
  const visualWidthCm = hasVisualBounds ? (maxX - minX) * scaleFactor : 0;
  const visualHeightCm = hasVisualBounds ? (maxY - minY) * scaleFactor : 0;
  const padding = Number(neonRules.backboard_padding_cm);
  const warnings = [];

  if (!complete) warnings.push(`Aksara tidak disokong: ${[...unsupportedCharacters].join(' ')}`);
  if (targetHeight < 5) warnings.push('Tinggi tulisan bawah 5 cm terlalu kecil untuk neon flex.');
  if (trackingCm < Number(neonRules.minimum_spacing_mm) / 10) warnings.push('Letter spacing bawah 0.8 cm: jarak laluan mungkin terlalu rapat dan perlu disemak.');
  warnings.push('Jarak laluan, lurus minimum dan tight curve perlu semakan production pada centerline path.');

  return {
    complete,
    fontId,
    fontName: font.name,
    targetTextHeightCm: targetHeight,
    scaleFactor,
    letterSpacingCm: trackingCm,
    letterSpacingUnits,
    textWidthUnits: widestAdvanceUnits,
    textWidthCm: round(widestAdvanceUnits * scaleFactor),
    visualTextWidthCm: round(visualWidthCm),
    visualTextHeightCm: round(visualHeightCm),
    backboardWidthCm: round(visualWidthCm + padding * 2),
    backboardHeightCm: round(visualHeightCm + padding * 2),
    kerningUnitsTotal: round(kerningUnitsTotal, 3),
    letterSpacingUnitsTotal: round(letterSpacingUnitsTotal, 3),
    unsupportedCharacters: [...unsupportedCharacters],
    warnings,
    tubeLengthStatus: 'Tube length perlu semakan production',
    tubeWidthMm: Number(neonRules.tube_width_mm),
  };
}

export function getPreviewLetterSpacingEm(fontId, targetTextHeightCm, letterSpacingCm) {
  const font = measurementData.fonts.find((item) => item.id === fontId);
  const height = Number(targetTextHeightCm);
  if (!font || !height) return 0;
  const spacingUnits = Number(letterSpacingCm) * font.referenceHeightUnits / height;
  return spacingUnits / font.unitsPerEm;
}
