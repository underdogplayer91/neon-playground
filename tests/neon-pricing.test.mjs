import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateNeonPrice, doubleLineFontIds, getAreaRateRmPerSqft, isDoubleLineFont, minimumHeightForFont, neonPricingConfig, productionModeForFont } from '../src/pricingConfig.js';

test('only imported double-line folder fonts receive double-line pricing', () => {
  assert.equal(doubleLineFontIds.length, 18);
  assert.equal(isDoubleLineFont('empire-outline'), true);
  assert.equal(productionModeForFont('westcoast'), 'double');
  assert.equal(isDoubleLineFont('beachfront-cn'), false);
  assert.equal(productionModeForFont('beachfront-cn'), 'single');
  assert.equal(minimumHeightForFont('empire-outline'), 15);
  assert.equal(minimumHeightForFont('beachfront-cn'), 10);
});

test('minimum price applies to a small text design', () => {
  const result = calculateNeonPrice({ visualTextWidthCm: 10, backboardWidthCm: 16, backboardHeightCm: 16 });
  assert.equal(neonPricingConfig.minimumPriceRm, 150);
  assert.equal(result.textPriceRm, 150);
  assert.ok(result.finalPriceRm > neonPricingConfig.minimumPriceRm);
});

test('one character still starts from RM150 before selected add-ons', () => {
  const result = calculateNeonPrice({ visualTextWidthCm: 2, backboardWidthCm: 8, backboardHeightCm: 16, backboardStyle: 'black' });
  assert.equal(result.textPriceRm, 150);
  assert.equal(result.finalPriceRm, 150);
});

test('prices below RM200 stay unchanged and larger boards use the new rates and deductions', () => {
  assert.equal(getAreaRateRmPerSqft(2.999), 100);
  assert.equal(getAreaRateRmPerSqft(3), 100);
  assert.equal(getAreaRateRmPerSqft(5), 100);
  assert.equal(getAreaRateRmPerSqft(10), 93);
  assert.equal(getAreaRateRmPerSqft(19.999), 93);
  assert.equal(getAreaRateRmPerSqft(20), 88);
  const belowTwoHundred = calculateNeonPrice({ backboardWidthCm: 30.48, backboardHeightCm: 30.48, backboardStyle: 'black' });
  assert.equal(belowTwoHundred.textPriceRm, 150);
  assert.equal(belowTwoHundred.pricingDeductionRm, 0);
  const fiveSqft = calculateNeonPrice({ visualTextWidthCm: 1, backboardWidthCm: 152.4, backboardHeightCm: 30.48, backboardStyle: 'black' });
  assert.equal(fiveSqft.acrylicAreaSqft, 5);
  assert.equal(fiveSqft.areaRateRmPerSqft, 100);
  assert.equal(fiveSqft.pricingDeductionRm, 50);
  assert.equal(fiveSqft.textPriceRm, 450);
  const tenSqft = calculateNeonPrice({ backboardWidthCm: 304.8, backboardHeightCm: 30.48, backboardStyle: 'black' });
  assert.equal(tenSqft.areaRateRmPerSqft, 93);
  assert.equal(tenSqft.pricingDeductionRm, 80);
  assert.equal(tenSqft.textPriceRm, 850);
  const twentySqft = calculateNeonPrice({ backboardWidthCm: 609.6, backboardHeightCm: 30.48, backboardStyle: 'black' });
  assert.equal(twentySqft.areaRateRmPerSqft, 88);
  assert.equal(twentySqft.pricingDeductionRm, 80);
  assert.equal(twentySqft.textPriceRm, 1680);
});

test('only the measured double-line word share receives the double-line multiplier', () => {
  const base = calculateNeonPrice({ visualTextWidthCm: 40, backboardWidthCm: 46, backboardHeightCm: 22 });
  const upgraded = calculateNeonPrice({
    visualTextWidthCm: 55,
    backboardWidthCm: 60.96,
    backboardHeightCm: 30.48,
    wordPricing: [
      { productionLine: 'single', visualAreaCm2: 300 },
      { productionLine: 'double', visualAreaCm2: 100 },
    ],
    backboardStyle: 'black',
  });
  assert.ok(upgraded.finalPriceRm > base.finalPriceRm);
  assert.equal(upgraded.singleLineShare, 0.75);
  assert.equal(upgraded.doubleLineShare, 0.25);
  assert.equal(upgraded.productionMultiplier, 1.0875);
  assert.equal(upgraded.textPriceRm, 150);
  assert.equal(upgraded.finalPriceRm, 163.13);
  assert.equal(upgraded.backboardAddonRm, 0);
  assert.equal(upgraded.acrylicPriceRm, 0);
  assert.equal(upgraded.colourAddonRm, 0);
});

test('multicolour never adds a surcharge', () => {
  const singleColour = calculateNeonPrice({ backboardWidthCm: 60.96, backboardHeightCm: 30.48, backboardStyle: 'black' });
  const multicolour = calculateNeonPrice({ backboardWidthCm: 60.96, backboardHeightCm: 30.48, backboardStyle: 'black', isMulticolour: true });
  assert.equal(neonPricingConfig.multicolourAddonRm, 0);
  assert.equal(multicolour.colourAddonRm, 0);
  assert.equal(multicolour.finalPriceRm, singleColour.finalPriceRm);
});

test('transparent acrylic adds RM10 per square foot while black PVC adds nothing', () => {
  const doubleLineWord = [{ productionLine: 'double', visualAreaCm2: 100 }];
  const transparent = calculateNeonPrice({ visualTextWidthCm: 40, backboardWidthCm: 60.96, backboardHeightCm: 30.48, backboardStyle: 'transparent', wordPricing: doubleLineWord });
  const black = calculateNeonPrice({ visualTextWidthCm: 40, backboardWidthCm: 60.96, backboardHeightCm: 30.48, backboardStyle: 'black', wordPricing: doubleLineWord });
  assert.equal(transparent.acrylicAreaSqft, 2);
  assert.equal(transparent.acrylicPriceRm, 20);
  assert.equal(black.acrylicPriceRm, 0);
  assert.equal(black.backboardAddonRm, 0);
  assert.equal(transparent.finalPriceRm - black.finalPriceRm, 20);
});
