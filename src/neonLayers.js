import { calculateNeonSize, neonRules } from './neonSizing.js';

const round = (value, digits = 1) => Number(value.toFixed(digits));
const boxesOverlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
const boxGap = (a, b) => {
  const dx = Math.max(a.left - b.right, b.left - a.right, 0);
  const dy = Math.max(a.top - b.bottom, b.top - a.bottom, 0);
  return Math.hypot(dx, dy);
};

export function createTextLayer(overrides = {}) {
  return {
    id: globalThis.crypto?.randomUUID?.() || `layer-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text: '',
    font_id: 'beachfront-cn',
    colour: 'pink',
    target_height_cm: 15,
    letter_spacing_cm: 0,
    x_cm: 3,
    y_cm: 3,
    locked: false,
    visible: true,
    production_mode: 'single',
    word_mode: 'continuous',
    detached: false,
    line_index: 0,
    rotation_deg: 0,
    ...overrides,
  };
}

export function layoutAutomaticWords(layers, startX = 3, startY = 3) {
  const measured = layers.map((layer) => {
    const measurement = layer.text.trim() ? calculateNeonSize({
      text: layer.text.trim(),
      fontId: layer.font_id,
      targetTextHeightCm: layer.target_height_cm,
      letterSpacingCm: layer.letter_spacing_cm,
    }) : null;
    return { layer, measurement };
  });
  const lineStep = Math.max(1, ...measured.map(({ layer, measurement }) => measurement?.visualTextHeightCm || layer.target_height_cm || 0)) + 2;
  const lineCursors = new Map();
  return measured.map(({ layer, measurement }) => {
    const lineIndex = Math.max(0, Number(layer.line_index) || 0);
    const cursorX = lineCursors.get(lineIndex) ?? startX;
    const positioned = layer.detached ? layer : { ...layer, x_cm: cursorX, y_cm: startY + lineIndex * lineStep };
    const standardWordGapCm = Math.max(1.2, (layer.target_height_cm || 10) * 0.22);
    const naturalAdvance = (measurement?.visualTextWidthCm || 0) + standardWordGapCm;
    lineCursors.set(lineIndex, cursorX + naturalAdvance);
    return positioned;
  });
}

export function calculateLayerDesign(layers) {
  const measuredLayers = layers.map((layer) => {
    const measurement = layer.text.trim() ? calculateNeonSize({
      text: layer.text.trim(),
      fontId: layer.font_id,
      targetTextHeightCm: layer.target_height_cm,
      letterSpacingCm: layer.letter_spacing_cm,
    }) : null;
    return { ...layer, measurement };
  });
  const visible = measuredLayers.filter((layer) => layer.visible && layer.measurement?.complete);
  if (!visible.length) return { layers: measuredLayers, complete: false, warnings: [], overlaps: [] };

  const boxes = visible.map((layer) => {
    const width = layer.measurement.visualTextWidthCm;
    const height = layer.measurement.visualTextHeightCm;
    const radians = ((Number(layer.rotation_deg) || 0) * Math.PI) / 180;
    const rotatedWidth = Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians));
    const rotatedHeight = Math.abs(width * Math.sin(radians)) + Math.abs(height * Math.cos(radians));
    const centerX = layer.x_cm + width / 2;
    const centerY = layer.y_cm + height / 2;
    return {
      id: layer.id,
      kind: 'text',
      left: centerX - rotatedWidth / 2,
      top: centerY - rotatedHeight / 2,
      right: centerX + rotatedWidth / 2,
      bottom: centerY + rotatedHeight / 2,
    };
  });
  const minX = Math.min(...boxes.map((box) => box.left));
  const minY = Math.min(...boxes.map((box) => box.top));
  const maxX = Math.max(...boxes.map((box) => box.right));
  const maxY = Math.max(...boxes.map((box) => box.bottom));
  const padding = Number(neonRules.backboard_padding_cm);
  const warnings = [];
  const overlaps = [];
  const minimumGapCm = Number(neonRules.minimum_spacing_mm) / 10;

  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      if (boxesOverlap(boxes[i], boxes[j])) {
        overlaps.push([boxes[i].id, boxes[j].id]);
        warnings.push('Ada perkataan yang bertindih. Semak susunan sebelum production.');
      } else if (boxGap(boxes[i], boxes[j]) < minimumGapCm) {
        warnings.push('Jarak antara text layer kurang daripada 8 mm.');
      }
    }
  }
  if (visible.some((layer) => layer.target_height_cm < 5)) warnings.push('Ada perkataan terlalu kecil untuk neon flex.');
  visible.forEach((layer) => layer.measurement.warnings.forEach((warning) => warnings.push(warning)));

  return {
    layers: measuredLayers,
    complete: true,
    bounds: { minX, minY, maxX, maxY },
    designWidthCm: round(maxX - minX),
    designHeightCm: round(maxY - minY),
    backboardWidthCm: round(maxX - minX + padding * 2),
    backboardHeightCm: round(maxY - minY + padding * 2),
    boardOriginX: minX - padding,
    boardOriginY: minY - padding,
    paddingCm: padding,
    overlaps,
    warnings: [...new Set(warnings)],
  };
}
