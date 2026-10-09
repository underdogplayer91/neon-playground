// Classic package guidance only: these are ranges, not measured glyph dimensions.
export function getClassicSizeGuide(text) {
  const value = String(text || '').trim();
  const characterCount = [...value.replace(/\s/g, '')].length;
  const lineCount = value.replace(/\r/g, '').split('\n').length;
  if (!characterCount || characterCount > 15 || lineCount >= 3) return null;
  return {
    widthCm: characterCount <= 8 ? 60 : 85,
    minHeightCm: lineCount === 2 ? 20 : 15,
    maxHeightCm: lineCount === 2 ? 25 : 20,
    lineCount,
  };
}
