export const neonPricingConfig = Object.freeze({
  minimumPriceRm: 150,
  pricePerAcrylicSqftRm: 10,
  preserveLegacyPriceBelowRm: 200,
  legacyAreaPricingTiers: Object.freeze([
    Object.freeze({ upToSqft: 3, rateRmPerSqft: 130 }),
    Object.freeze({ upToSqft: 10.000001, rateRmPerSqft: 100 }),
    Object.freeze({ upToSqft: Infinity, rateRmPerSqft: 90 }),
  ]),
  areaPricingTiers: Object.freeze([
    Object.freeze({ upToSqft: 10, rateRmPerSqft: 100, deductionRm: 50 }),
    Object.freeze({ upToSqft: 20, rateRmPerSqft: 93, deductionRm: 80 }),
    Object.freeze({ upToSqft: Infinity, rateRmPerSqft: 88, deductionRm: 80 }),
  ]),
  singleLineMultiplier: 1,
  doubleLineMultiplier: 1.35,
  blackPvcAddonRm: 0,
  transparentAcrylicAddonRm: 0,
  multicolourAddonRm: 0,
});

// These are the 18 fonts imported from the customer's "Double line font"
// folder. Production type and its multiplier are selected from the font,
// never from a customer-facing toggle.
export const doubleLineFontIds = Object.freeze([
  'westcoast', 'vancouver', 'submarine', 'milan', 'manhattan', 'majorca',
  'scifi-cn', 'nevada', 'neonglow-cn', 'mayfair-cn', 'marquee-cn', 'loveneon',
  'milford-hollow', 'neon', 'sci-fied-x-outline', 'mars-outline',
  'bouncy-personal-use-only', 'empire-outline',
]);

const doubleLineFontSet = new Set(doubleLineFontIds);
export const isDoubleLineFont = (fontId) => doubleLineFontSet.has(fontId);
export const productionModeForFont = (fontId) => isDoubleLineFont(fontId) ? 'double' : 'single';
export const minimumHeightForFont = (fontId) => isDoubleLineFont(fontId) ? 15 : 10;

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export function getAreaRateRmPerSqft(areaSqft, config = neonPricingConfig) {
  const area = Math.max(0, Number(areaSqft) || 0);
  return config.areaPricingTiers.find((tier) => area < tier.upToSqft)?.rateRmPerSqft
    ?? config.areaPricingTiers.at(-1).rateRmPerSqft;
}

const getTier = (areaSqft, tiers) => tiers.find((tier) => areaSqft < tier.upToSqft) ?? tiers.at(-1);

export function calculateNeonPrice({
  visualTextWidthCm,
  backboardWidthCm,
  backboardHeightCm,
  productionLine = 'single',
  wordPricing = [],
  backboardStyle = 'transparent',
}, config = neonPricingConfig) {
  const textWidth = Math.max(0, Number(visualTextWidthCm) || 0);
  const backboardWidth = Math.max(0, Number(backboardWidthCm) || 0);
  const backboardHeight = Math.max(0, Number(backboardHeightCm) || 0);
  const backboardAreaSqft = (backboardWidth * backboardHeight) / (30.48 ** 2);
  const legacyTier = getTier(backboardAreaSqft, config.legacyAreaPricingTiers);
  const legacyTextPrice = Math.max(config.minimumPriceRm, backboardAreaSqft * legacyTier.rateRmPerSqft);
  const useLegacyPrice = legacyTextPrice < config.preserveLegacyPriceBelowRm;
  const currentTier = getTier(backboardAreaSqft, config.areaPricingTiers);
  const areaRateRmPerSqft = useLegacyPrice ? legacyTier.rateRmPerSqft : currentTier.rateRmPerSqft;
  const pricingDeductionRm = useLegacyPrice ? 0 : currentTier.deductionRm;
  const textPrice = useLegacyPrice
    ? legacyTextPrice
    : Math.max(config.minimumPriceRm, (backboardAreaSqft * currentTier.rateRmPerSqft) - pricingDeductionRm);
  const acrylicPrice = backboardStyle === 'transparent'
    ? backboardAreaSqft * config.pricePerAcrylicSqftRm
    : 0;
  const backboardAddon = backboardStyle === 'black'
    ? config.blackPvcAddonRm
    : config.transparentAcrylicAddonRm;
  const validWordPricing = wordPricing
    .map((word) => ({
      productionLine: word?.productionLine === 'double' ? 'double' : 'single',
      visualAreaCm2: Math.max(0, Number(word?.visualAreaCm2) || 0),
    }))
    .filter((word) => word.visualAreaCm2 > 0);
  const totalWordAreaCm2 = validWordPricing.reduce((total, word) => total + word.visualAreaCm2, 0);
  const doubleLineAreaCm2 = validWordPricing
    .filter((word) => word.productionLine === 'double')
    .reduce((total, word) => total + word.visualAreaCm2, 0);
  const doubleLineShare = totalWordAreaCm2 > 0
    ? doubleLineAreaCm2 / totalWordAreaCm2
    : productionLine === 'double' ? 1 : 0;
  const singleLineShare = 1 - doubleLineShare;
  const singleLineTextPrice = textPrice * singleLineShare * config.singleLineMultiplier;
  const doubleLineTextPrice = textPrice * doubleLineShare * config.doubleLineMultiplier;
  const productionMultiplier = (singleLineShare * config.singleLineMultiplier)
    + (doubleLineShare * config.doubleLineMultiplier);
  const colourAddon = 0;
  const finalPrice = singleLineTextPrice + doubleLineTextPrice + acrylicPrice + backboardAddon;

  return {
    textPriceRm: roundMoney(textPrice),
    acrylicAreaSqft: Number(backboardAreaSqft.toFixed(3)),
    areaRateRmPerSqft,
    pricingDeductionRm,
    acrylicPriceRm: roundMoney(acrylicPrice),
    backboardAddonRm: roundMoney(backboardAddon),
    productionMultiplier,
    singleLineShare,
    doubleLineShare,
    singleLineTextPriceRm: roundMoney(singleLineTextPrice),
    doubleLineTextPriceRm: roundMoney(doubleLineTextPrice),
    colourAddonRm: roundMoney(colourAddon),
    finalPriceRm: roundMoney(finalPrice),
  };
}

export const formatRm = (value) => `RM${Number(value || 0).toFixed(2)}`;
