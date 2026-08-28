# DermaScanAI — Backend API

Node.js / Express REST API powering the AI features of DermaScanAI.

---

## Stack

- **Node.js** + **Express 4**
- **Groq SDK** — LLM inference (Llama 3)
- **Helmet** — security headers
- **express-rate-limit** — rate limiting
- **Morgan** — HTTP request logging
- **Winston** — structured logging
- **Jest + Supertest** — testing

---

## Environment Setup

```bash
cp .env.example .env
```

Fill in `.env`:

```env
PORT=3000
GROQ_API_KEY=your_groq_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
NODE_ENV=development
# Optional: restrict CORS in production
# ALLOWED_ORIGINS=https://your-app.com,https://your-other-origin.com
```

---

## Installation & Running

```bash
npm install
npm run dev      # Development with nodemon
npm start        # Production
```

---

## Testing

```bash
npm test                # Run all tests with coverage
npm run test:watch      # Watch mode
```

---

## API Reference

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Server health check |
| GET | `/api/v1/health` | Versioned health check |

### Ingredients

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/v1/ingredients/ocr` | `{ imageBase64 }` | Extract text from product image |
| POST | `/api/v1/ingredients/analyze` | `{ ingredientText }` | Analyze skincare ingredients |

### Skin Quiz

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/v1/quiz/analyze` | `{ userAnswers: [{question, answer}] }` | Determine skin type from quiz |

### Chatbot

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/v1/chatbot/chat` | `{ message, messages }` | Send message to skin care AI |

### Weather

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/v1/weather/weather` | `{ city, timeOfDay }` | Get weather-based skin recommendations |

### Disease

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/v1/disease/analyze` | `{ diseaseName }` | Get disease information and recommendations |

### Dashboard

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/v1/dashboard/welcome` | `{}` | AI-generated welcome message |
| POST | `/api/v1/dashboard/mood` | `{ mood: { label, emoji, description } }` | Mood-based skin tip |
| POST | `/api/v1/dashboard/glow-tip` | `{ tip }` | Detailed glow tip information |

---

## Standard Response Format

All endpoints return:

```json
{
  "status": "success",
  "data": { ... }
}
```

Error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "errorId": "err_1234567_abc123"
  }
}
```

---

## Rate Limits

| Limiter | Max Requests | Window |
|---|---|---|
| General | 100 | 15 minutes |
| AI Endpoints | 20 | 15 minutes |

AI endpoints: `/ingredients`, `/quiz`, `/chatbot`, `/weather`, `/dashboard`

---

## Project Structure

```
server.js           Entry point — middleware, routes, error handler
config/
  constants.js      Skin keywords, available AI models
middleware/
  validation.js     Input validation & sanitization middleware
routes/
  analyzeIngredients.js
  skinQuiz.js
  skinChatbot.js
  weatherRecommendations.js
  diseaseRecommendations.js
  dashboard.js      Welcome, mood, glow-tip endpoints
services/
  groqService.js    All Groq LLM calls
  ocrService.js     OCR processing
  weatherService.js OpenWeatherMap integration
utils/
  helpers.js        Skin-related text validation
__tests__/
  helpers.test.js
  validation.test.js
```
