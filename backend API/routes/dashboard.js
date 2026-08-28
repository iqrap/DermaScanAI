const express = require('express');
const router = express.Router();
const { generateWelcomeMessage, generateMoodMessage, generateGlowTipInfo, generateMythsAndFacts } = require('../services/ModelService');
const { validateMoodRequest, validateGlowTipRequest } = require('../middleware/validation');

// Generate a welcome message for the dashboard
router.post('/welcome', async (req, res) => {
  try {
    const result = await generateWelcomeMessage();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Welcome message error:', error);
    res.status(500).json({
      error: { code: 'WELCOME_ERROR', message: 'Unable to generate welcome message' }
    });
  }
});

// Generate a mood-based message
router.post('/mood', validateMoodRequest, async (req, res) => {
  try {
    const { mood } = req.body;
    const message = await generateMoodMessage(mood);
    res.json({ success: true, data: { message } });
  } catch (error) {
    console.error('Mood message error:', error);
    res.status(500).json({
      error: { code: 'MOOD_ERROR', message: 'Unable to generate mood message' }
    });
  }
});

// Generate glow tip information
router.post('/glow-tip', validateGlowTipRequest, async (req, res) => {
  try {
    const { tip } = req.body;
    const result = await generateGlowTipInfo(tip);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Glow tip error:', error);
    res.status(500).json({
      error: { code: 'GLOW_TIP_ERROR', message: 'Unable to generate glow tip info' }
    });
  }
});

// Generate myths and facts
router.post('/myths', async (req, res) => {
  try {
    const result = await generateMythsAndFacts();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Myths & facts error:', error);
    res.status(500).json({
      error: { code: 'MYTHS_ERROR', message: 'Unable to generate myths and facts' }
    });
  }
});

module.exports = router;
