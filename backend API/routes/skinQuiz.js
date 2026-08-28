const express = require('express');
const router = express.Router();
const { analyzeSkinQuiz } = require('../services/ModelService');
const { validateQuizRequest } = require('../middleware/validation');

router.post('/analyze', validateQuizRequest, async (req, res) => {
  try {
    const { userAnswers } = req.body;
    
    const result = await analyzeSkinQuiz(userAnswers);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Quiz analysis error:', error);
    res.status(500).json({ 
      error: "Analysis Error", 
      message: error.message || "Unable to analyze your skin type at the moment"
    });
  }
});

module.exports = router;