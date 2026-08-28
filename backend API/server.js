require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import route modules
const analyzeIngredientsRoutes = require('./routes/analyzeIngredients');
const skinQuizRoutes = require('./routes/skinQuiz');
const skinChatbotRoutes = require('./routes/skinChatbot');
const weatherRoutes = require('./routes/weatherRecommendations');
const diseaseRoutes = require('./routes/diseaseRecommendations');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet adds security headers (CSP, X-Frame-Options, etc.)
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API usage
  crossOriginEmbedderPolicy: false,
}));

// CORS - restrict to known origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['*']; // Allow all in development

app.use(cors({
  origin: allowedOrigins.includes('*') ? true : allowedOrigins,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
}));

// Rate limiting - prevent API abuse
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { code: 'RATE_LIMIT', message: 'Too many requests, please try again later.' }
  },
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // stricter for AI-heavy endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { code: 'RATE_LIMIT', message: 'Too many AI requests, please wait a few minutes.' }
  },
});

app.use(generalLimiter);

// ============================================
// LOGGING MIDDLEWARE
// ============================================
app.use(morgan('combined', {
  skip: (req) => req.path === '/health', // Don't log health checks
}));

// ============================================
// BODY PARSING
// ============================================
app.use(express.json({ limit: '10mb' })); // Reduced from 50mb - images should use FormData
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// ============================================
// API ROUTES (v1 versioned)
// ============================================

// Apply strict rate limiter to AI-heavy endpoints
app.use('/api/v1/ingredients', strictLimiter, analyzeIngredientsRoutes);
app.use('/api/v1/quiz', strictLimiter, skinQuizRoutes);
app.use('/api/v1/chatbot', strictLimiter, skinChatbotRoutes);
app.use('/api/v1/weather', strictLimiter, weatherRoutes);
app.use('/api/v1/disease', diseaseRoutes);
app.use('/api/v1/dashboard', strictLimiter, dashboardRoutes);

// Legacy routes (backward compatibility - redirect to v1)
app.use('/api/ingredients', strictLimiter, analyzeIngredientsRoutes);
app.use('/api/quiz', strictLimiter, skinQuizRoutes);
app.use('/api/chatbot', strictLimiter, skinChatbotRoutes);
app.use('/api/weather', strictLimiter, weatherRoutes);
app.use('/api/disease', diseaseRoutes);
app.use('/api/dashboard', strictLimiter, dashboardRoutes);

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// ============================================
// GLOBAL ERROR HANDLER (standardized format)
// ============================================
app.use((err, req, res, _next) => {
  // Generate unique error ID for debugging
  const errorId = `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  console.error(`[${errorId}] Unhandled error:`, err);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'Something went wrong'
        : err.message || 'Something went wrong',
      errorId, // Include for debugging in development
    },
  });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API v1 base: http://localhost:${PORT}/api/v1`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  POST /api/v1/ingredients/analyze`);
  console.log(`  POST /api/v1/ingredients/ocr`);
  console.log(`  POST /api/v1/quiz/analyze`);
  console.log(`  POST /api/v1/chatbot/chat`);
  console.log(`  POST /api/v1/weather/weather`);
  console.log(`  POST /api/v1/disease/analyze`);
  console.log(`  POST /api/v1/dashboard/welcome`);
  console.log(`  POST /api/v1/dashboard/mood`);
  console.log(`  POST /api/v1/dashboard/glow-tip`);
  console.log(`  POST /api/v1/dashboard/myths`);
});
