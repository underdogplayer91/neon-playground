// Shared by the Classic configurator and server-side payment validation.
export function getClassicPackage(characterCount) {
  const count = Number.isFinite(characterCount) ? Math.max(0, Math.floor(characterCount)) : 0;
  if (!count) return { name: 'Belum dipilih', price: null, tier: 'none' };
  if (count <= 8) return { name: 'Pakej 8 Huruf', price: 150, tier: 'basic' };
  if (count <= 15) return {
    name: 'Pakej 15 Huruf',
    price: Math.round(150 + ((count - 8) * 50 / 7)),
    tier: 'plus',
  };
  const extraCharacters = count - 15;
  return {
    name: 'Design Custom', price: null, tier: 'custom',
    estimatedPrice: 200 + (Math.floor(extraCharacters / 10) * 100) + ((extraCharacters % 10) * 12),
  };
}

export function normalizeClassicCheckoutOrder(order) {
  if (order?.pricingModel !== 'classic-package') return order;
  const characterCount = [...String(order.text || '').replace(/\s/g, '')].length;
  if (!characterCount) return order;
  const selected = getClassicPackage(characterCount);
  return {
    ...order, characterCount, tier: selected.tier, packageName: selected.name,
    price: selected.price ?? 100,
    estimatedPrice: selected.estimatedPrice ?? selected.price,
  };
}
