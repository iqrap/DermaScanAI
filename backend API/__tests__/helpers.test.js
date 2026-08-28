const { isSkinRelated, validateSkinRelated } = require('../utils/helpers');

describe('isSkinRelated', () => {
  test('returns true for text containing skin-related keywords', () => {
    expect(isSkinRelated('This cream contains retinol and vitamin c')).toBe(true);
    expect(isSkinRelated('A sunscreen with SPF 50')).toBe(true);
    expect(isSkinRelated('Hyaluronic acid serum for skin hydration')).toBe(true);
  });

  test('returns false for non-skin-related text', () => {
    expect(isSkinRelated('The weather is nice today')).toBe(false);
    expect(isSkinRelated('I like to play football')).toBe(false);
  });

  test('is case-insensitive', () => {
    expect(isSkinRelated('RETINOL cream')).toBe(true);
    expect(isSkinRelated('Vitamin C Serum')).toBe(true);
  });
});

describe('validateSkinRelated', () => {
  test('returns false for text shorter than 20 characters', () => {
    expect(validateSkinRelated('retinol cream')).toBe(false);
    expect(validateSkinRelated('')).toBe(false);
    expect(validateSkinRelated(null)).toBe(false);
  });

  test('returns true for long skin-related text', () => {
    const text = 'This amazing moisturizer contains hyaluronic acid and ceramide for deep hydration';
    expect(validateSkinRelated(text)).toBe(true);
  });

  test('returns false for long non-skin-related text', () => {
    const text = 'This is a very long text about cooking pasta and making delicious sauces at home';
    expect(validateSkinRelated(text)).toBe(false);
  });
});
