const express = require('express');
const router = express.Router();
const { analyzeDisease } = require('../services/ModelService');

// ─── AI-powered disease recommendations ─────────────────────────────────────
// Uses Qwen (Alibaba Cloud) with Gemini fallback (via groqService.analyzeDisease)
// to generate clinical descriptions, causes, and treatment recommendations.

router.post('/analyze', async (req, res) => {
  try {
    const { diseaseName } = req.body;

    if (!diseaseName) {
      return res.status(400).json({ error: "Disease name is required" });
    }

    // Generate AI-powered clinical recommendations
    const analysis = await analyzeDisease(diseaseName);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Disease Analysis error:', error);
    res.status(500).json({
      error: "Analysis Error",
      message: error.message || "An error occurred during disease analysis",
    });
  }
});

module.exports = router;
