const express = require('express');
const router = express.Router();
const { analyzeIngredients } = require('../services/ModelService');
const { performOCR } = require('../services/ocrService');
const { validateSkinRelated } = require('../utils/helpers');
const { validateAnalyzeRequest } = require('../middleware/validation');

router.post('/analyze', validateAnalyzeRequest, async (req, res) => {
  try {
    const { ingredientText, ocrProvider, ocrConfidence } = req.body;
    
    if (!validateSkinRelated(ingredientText)) {
      return res.status(400).json({ 
        error: "Invalid Product Type",
        message: "This doesn't appear to be a skin product. Please scan a skincare product or medicine."
      });
    }
    
    const analysis = await analyzeIngredients(ingredientText, ocrProvider, ocrConfidence);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: "Analysis Error", 
      message: error.message || "An error occurred during analysis"
    });
  }
});

router.post('/ocr', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const apiKey = process.env.OCR_SPACE_API_KEY;
    
    if (!imageBase64) {
      return res.status(400).json({ error: "Image data is required" });
    }
    
    const ocrResult = await performOCR(apiKey, imageBase64);
    
    res.json({
      success: true,
      data: ocrResult
    });
  } catch (error) {
    console.error('OCR error:', error);
    res.status(500).json({ 
      error: "OCR Error", 
      message: error.message || "Failed to read ingredients from image"
    });
  }
});

module.exports = router;