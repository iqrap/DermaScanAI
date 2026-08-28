function validateAnalyzeRequest(req, res, next) {
  const { ingredientText } = req.body;
  
  if (!ingredientText || ingredientText.trim().length < 10) {
    return res.status(400).json({ 
      error: "Invalid Input", 
      message: "Please enter the full ingredient list" 
    });
  }
  
  next();
}

function validateQuizRequest(req, res, next) {
  const { userAnswers } = req.body;
  
  if (!userAnswers || !Array.isArray(userAnswers) || userAnswers.length === 0) {
    return res.status(400).json({ 
      error: "Invalid Request", 
      message: "User answers are required" 
    });
  }
  
  next();
}

function validateChatRequest(req, res, next) {
  const { message, messages } = req.body;
  
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ 
      error: "Invalid Request", 
      message: "Message is required" 
    });
  }
  
  next();
}

function validateWeatherRequest(req, res, next) {
  const { city } = req.body;
  
  if (!city) {
    return res.status(400).json({ 
      error: "Invalid Request", 
      message: "City name is required" 
    });
  }
  
  next();
}

function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>]/g, '').trim();
}

function validateMoodRequest(req, res, next) {
  const { mood } = req.body;
  if (!mood || !mood.label || !mood.emoji || !mood.description) {
    return res.status(400).json({
      error: { code: 'INVALID_INPUT', message: 'Mood object with label, emoji, and description is required' }
    });
  }
  // Sanitize
  mood.label = sanitizeString(mood.label);
  mood.description = sanitizeString(mood.description);
  next();
}

function validateGlowTipRequest(req, res, next) {
  const { tip } = req.body;
  if (!tip || typeof tip !== 'string' || tip.trim().length === 0) {
    return res.status(400).json({
      error: { code: 'INVALID_INPUT', message: 'Tip name is required' }
    });
  }
  if (tip.length > 50) {
    return res.status(400).json({
      error: { code: 'INVALID_INPUT', message: 'Tip name is too long' }
    });
  }
  req.body.tip = sanitizeString(tip);
  next();
}

module.exports = {
  validateAnalyzeRequest,
  validateQuizRequest,
  validateChatRequest,
  validateWeatherRequest,
  validateMoodRequest,
  validateGlowTipRequest,
  sanitizeString
};