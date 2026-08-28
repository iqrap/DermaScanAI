# DermaScanAI — Mobile App

AI-powered skin care mobile application built with **Expo / React Native**.

---

## Features

| Feature | Description |
|---|---|
| Skin Disease Analyzer | Upload or capture a skin photo; the AI model detects 7 conditions |
| Product Scanner | OCR + ingredient analysis of skincare products |
| Skin Type Quiz | Personalized quiz to identify your skin type |
| Skin Chatbot | Conversational AI assistant for skin care questions |
| Weather Recommendations | Weather-aware skincare tips for your city |
| Routine Scheduler | Daily morning/evening skincare routine manager |
| Skin Mood Tracker | Daily mood tracker with AI-generated skin tips |
| Glow Up Tips | Curated skincare knowledge cards |

---

## Tech Stack

- **Expo SDK 52** with file-based routing (expo-router)
- **TypeScript**
- **Firebase** (Auth + Firestore)
- **Zustand** — centralized state management
- **expo-image-manipulator** — image compression before upload
- **expo-camera** — camera access

---

## Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio / Xcode (for device emulator) or Expo Go app

---

## Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your values in `.env`:

   ```env
   # Firebase
   EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

   # API Server (your local machine IP)
   EXPO_PUBLIC_COMPUTER_IP=192.168.x.x
   EXPO_PUBLIC_MODEL_API_URL=http://192.168.x.x:8000
   ```

---

## Installation

```bash
npm install
```

---

## Running the App

```bash
# Start development server
npx expo start

# Android
npx expo run:android

# iOS
npx expo run:ios
```

---

## Project Structure

```
app/                  Expo Router screens
  auth/               Login & Signup
  drawer/             Dashboard + side drawer screens
  features/           Feature screens (chatbot, disease, quiz, etc.)
src/
  components/         Shared UI components (ErrorBoundary, LoadingSkeleton)
  config/             env.ts, firebase.ts, apiconfig.js
  services/           apiService.ts — all backend API calls
  store/              useAppStore.ts — Zustand global state
  styles/             Shared style modules
  utils/              authUtils, firestoreUtils, imageUtils, routineUtils
assets/images/        Static image assets
```

---

## Architecture Notes

- All environment variables are accessed through `src/config/env.ts`
- All HTTP calls go through `src/services/apiService.ts`, which includes:
  - In-memory caching (10–30 min TTL per endpoint)
  - Timeout handling (30 s default)
- The root layout wraps the entire app in `ErrorBoundary` for crash safety
- Images are compressed to 1024px max / 80% quality before upload via `src/utils/imageUtils.ts`

---

## Building for Production

```bash
# Configure EAS
eas build:configure

# Android APK
eas build --platform android --profile preview

# Android AAB (Play Store)
eas build --platform android --profile production
```

---

## Related Services

| Service | Default Port | Description |
|---|---|---|
| Node.js Backend API | 3000 | AI features (chatbot, quiz, ingredients, weather) |
| Python Model API | 8000 | Skin disease ML model (FastAPI) |
