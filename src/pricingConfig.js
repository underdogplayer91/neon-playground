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
    Object.freeze({ fromSqft: 2, upToSqft: 4.000001, rateRmPerSqft: 100, deductionRm: 0 }),
    Object.freeze({ upToSqft: 10, rateRmPerSqft: 100, deductionRm: 50 }),
    Object.freeze({ upToSqft: 20, rateRmPerSqft: 93, deductionRm: 80 }),
    Object.freeze({ upToSqft: Infinity, rateRmPerSqft: 88, deductionRm: 80 }),
  ]),
  singleLineMultiplier: 1,
  doubleLineMultiplier: 1.35,
  blackPvcAddonRm: 0,
  transparentAcrylicAddonRm: 0,
  multicolourAddonRm: 0,
  areaStepSqft: 0.1,
  priceStepRm: 20,
  priceStepRoundUpFromRm: 11,
  characterPricingMaxAreaSqft: 2,
  characterPricingBands: Object.freeze([
    Object.freeze({ upToCharacters: 7, priceRm: 150 }),
    Object.freeze({ upToCharacters: 10, priceRm: 170 }),
    Object.freeze({ upToCharacters: 14, priceRm: 190 }),
    Object.freeze({ upToCharacters: Infinity, priceRm: 200 }),
  ]),
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
const roundAreaToStep = (value, step) => Math.round((value + Number.EPSILON) / step) * step;
export const roundNeonPriceToStep = (value, anchor, step, roundUpFrom) => {
  const safeValue = Math.max(anchor, Number(value) || 0);
  const steps = Math.floor((safeValue - anchor) / step);
  const lowerPrice = anchor + (steps * step);
  const remainder = safeValue - lowerPrice;
  return lowerPrice + (remainder >= roundUpFrom ? step : 0);
};

export function getAreaRateRmPerSqft(areaSqft, config = neonPricingConfig) {
  const area = Math.max(0, Number(areaSqft) || 0);
  return getTier(area, config.areaPricingTiers).rateRmPerSqft;
}

const getTier = (areaSqft, tiers) => tiers.find((tier) => (
  areaSqft >= (tier.fromSqft ?? 0) && areaSqft < tier.upToSqft
)) ?? tiers.at(-1);

export function calculateNeonPrice({
  visualTextWidthCm,
  backboardWidthCm,
  backboardHeightCm,
  productionLine = 'single',
  wordPricing = [],
  backboardStyle = 'transparent',
  characterCount = 0,
}, config = neonPricingConfig) {
  const textWidth = Math.max(0, Number(visualTextWidthCm) || 0);
  const backboardWidth = Math.max(0, Number(backboardWidthCm) || 0);
  const backboardHeight = Math.max(0, Number(backboardHeightCm) || 0);
  const measuredBackboardAreaSqft = (backboardWidth * backboardHeight) / (30.48 ** 2);
  const backboardAreaSqft = roundAreaToStep(measuredBackboardAreaSqft, config.areaStepSqft);
  const safeCharacterCount = Math.max(0, Math.floor(Number(characterCount) || 0));
  const usesCharacterBandPrice = backboardAreaSqft < config.characterPricingMaxAreaSqft;
  const characterBandPriceRm = usesCharacterBandPrice
    ? (config.characterPricingBands.find((band) => safeCharacterCount <= band.upToCharacters)?.priceRm
      ?? config.characterPricingBands.at(-1).priceRm)
    : null;
  const priceAnchorRm = characterBandPriceRm ?? config.minimumPriceRm;
  const legacyTier = getTier(backboardAreaSqft, config.legacyAreaPricingTiers);
  const legacyTextPrice = Math.max(config.minimumPriceRm, backboardAreaSqft * legacyTier.rateRmPerSqft);
  const useLegacyPrice = legacyTextPrice < config.preserveLegacyPriceBelowRm;
  const currentTier = getTier(backboardAreaSqft, config.areaPricingTiers);
  const areaRateRmPerSqft = useLegacyPrice ? legacyTier.rateRmPerSqft : currentTier.rateRmPerSqft;
  const pricingDeductionRm = usesCharacterBandPrice || useLegacyPrice ? 0 : currentTier.deductionRm;
  const calculatedTextPrice = usesCharacterBandPrice
    ? characterBandPriceRm
    : useLegacyPrice
      ? legacyTextPrice
      : Math.max(config.minimumPriceRm, (backboardAreaSqft * currentTier.rateRmPerSqft) - pricingDeductionRm);
  const textPrice = Math.max(priceAnchorRm, calculatedTextPrice);
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
  const calculatedFinalPrice = singleLineTextPrice + doubleLineTextPrice + acrylicPrice + backboardAddon;
  const finalPrice = roundNeonPriceToStep(
    calculatedFinalPrice,
    priceAnchorRm,
    config.priceStepRm,
    config.priceStepRoundUpFromRm,
  );

  return {
    textPriceRm: roundMoney(textPrice),
    acrylicAreaSqft: Number(backboardAreaSqft.toFixed(1)),
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
    usesCharacterBandPrice,
    finalPriceRm: finalPrice,
  };
}

export const formatRm = (value) => `RM${Math.round(Number(value) || 0)}`;
