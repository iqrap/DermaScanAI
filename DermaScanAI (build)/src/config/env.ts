// src/config/env.ts
// Centralized environment variable access with fallbacks
// In Expo, EXPO_PUBLIC_ prefixed vars are available via process.env

export const ENV = {
  // Firebase Configuration
  FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  FIREBASE_MEASUREMENT_ID: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || '',

  // API Configuration
  COMPUTER_IP: process.env.EXPO_PUBLIC_COMPUTER_IP || 'localhost',
  MODEL_API_URL: process.env.EXPO_PUBLIC_MODEL_API_URL || 'http://localhost:8000',

  // OpenWeatherMap API
  WEATHER_API_KEY: process.env.EXPO_PUBLIC_WEATHER_API_KEY || '',
};
