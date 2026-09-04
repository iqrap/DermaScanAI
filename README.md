## Project Structure

DermaScanAI is split into three independent services:

| Folder | Service | Tech Stack | Default Port |
|---|---|---|---|
| `DermaScanAI (build)/` | Mobile frontend | Expo + React Native + TypeScript | 8081 |
| `backend API/` | REST API backend | Node.js + Express | 3000 |
| `backend model/` | ML inference service | Python + FastAPI + TensorFlow | 8000 |

---

### 1. `DermaScanAI (build)/` — Mobile App

The AI-powered skincare mobile application built with **Expo / React Native**.

**Features**
- Skin disease analyzer (7 conditions)
- Product ingredient scanner (OCR + analysis)
- Skin type quiz
- AI skin chatbot
- Weather-based skincare recommendations
- Routine scheduler & mood tracker

**Tech Stack**
- Expo SDK 54 with file-based routing (`expo-router`)
- TypeScript
- Firebase (Auth + Firestore)
- Zustand (state management)
- `expo-camera`, `expo-image-manipulator`

**Quick Start**
```bash
cd "DermaScanAI (build)"
cp .env.example .env
npm install
npx expo start
```

**Key Subfolders**
- `app/` — Expo Router screens (auth, drawer, feature screens)
- `src/components/` — shared UI components
- `src/config/` — env, Firebase, API config
- `src/services/` — backend API calls
- `src/store/` — Zustand global state
- `src/utils/` — helpers for auth, images, routines, storage
- `assets/images/` — static images

---

### 2. `backend API/` — Node.js Backend

REST API that powers the AI features of the mobile app.

**Tech Stack**
- Node.js + Express 4
- Groq SDK (Llama 3 inference)
- Helmet, express-rate-limit, Morgan, Winston
- Jest + Supertest for testing

**Quick Start**
```bash
cd "backend API"
cp .env.example .env
npm install
npm run dev      # or npm start for production
```

**Key Endpoints**
- `POST /api/v1/ingredients/ocr` — extract text from product image
- `POST /api/v1/ingredients/analyze` — analyze skincare ingredients
- `POST /api/v1/quiz/analyze` — determine skin type
- `POST /api/v1/chatbot/chat` — skin care AI chatbot
- `POST /api/v1/weather/weather` — weather-based recommendations
- `POST /api/v1/disease/analyze` — disease info & recommendations
- `POST /api/v1/dashboard/*` — welcome, mood, glow-tip endpoints

**Key Subfolders**
- `config/` — constants & AI model config
- `middleware/` — input validation
- `routes/` — Express route handlers
- `services/` — Groq, OCR, weather integrations
- `utils/` — helpers
- `__tests__/` — Jest tests

---

### 3. `backend model/` — ML Model Service

FastAPI service hosting the TensorFlow skin disease detection models.

**Models**
- `model/Final_Disease_Datasets.h5` — disease classifier
- `model/skin_validator_model.h5` — skin image validator

**Detectable Conditions**
Acne, Benign Tumors, Lichen, No Disease, Vitiligo, Eczema, Scabies

**Tech Stack**
- Python 3.10+
- FastAPI + Uvicorn
- TensorFlow / Keras
- Pillow

**Quick Start**
```bash
cd "backend model"
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

**Key Files**
- `app.py` — main FastAPI application
- `main.py` — entry point
- `requirements.txt` — Python dependencies
- `model/` — trained model weights

