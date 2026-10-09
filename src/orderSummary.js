export function getCheckoutColourSummary(order) {
  const layerColours = (order?.designSnapshot?.layers || [])
    .map((layer) => layer?.colorLabel)
    .filter(Boolean);
  if (layerColours.length) return [...new Set(layerColours)].join(', ');

  const wordColours = (order?.wordColors || [])
    .map((item) => item?.label)
    .filter(Boolean);
  if (order?.colorMode === 'multi' && wordColours.length) {
    return [...new Set(wordColours)].join(', ');
  }

  return order?.colorLabel || '';
}

export function getCheckoutSizeSummary(order) {
  if (order?.pricingModel === 'classic-package') {
    const count = [...String(order.text || '').replace(/\s/g, '')].length;
    if (count > 0 && count <= 8) return '≤ 60cm';
    if (count > 8 && count <= 15) return '≤ 85cm';
  }
  return order?.sizeNote || 'Akan disahkan selepas design dibincangkan';
}
