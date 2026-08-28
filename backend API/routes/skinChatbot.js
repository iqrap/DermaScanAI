const express = require('express');
const router = express.Router();
const { skinChatbotResponse } = require('../services/ModelService');
const { validateChatRequest } = require('../middleware/validation');

router.post('/chat', validateChatRequest, async (req, res) => {
  try {
    const { message, messages } = req.body;
    
    const botReply = await skinChatbotResponse(messages, message);
    
    res.json({
      success: true,
      data: { reply: botReply }
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ 
      error: "Chat Error", 
      message: error.message || "Failed to get response. Please check your internet connection."
    });
  }
});

module.exports = router;