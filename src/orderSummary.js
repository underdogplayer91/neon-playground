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
