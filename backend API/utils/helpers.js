const { SKIN_RELATED_KEYWORDS } = require('../config/constants');

function isSkinRelated(text) {
  const lowerText = text.toLowerCase();
  return SKIN_RELATED_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

function validateSkinRelated(text) {
  if (!text || text.length < 20) return false;
  return isSkinRelated(text);
}

module.exports = {
  isSkinRelated,
  validateSkinRelated
};