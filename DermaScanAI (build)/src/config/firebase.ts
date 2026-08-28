// Import AsyncStorage for saving auth data on device
import AsyncStorage from "@react-native-async-storage/async-storage"
// Import Firebase app functions
import { initializeApp, getApps, getApp } from "firebase/app"
// Import Firebase authentication functions
import { initializeAuth, getAuth, type Auth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
// Import Firebase storage
import { getStorage } from "firebase/storage"
import { ENV } from "./env"

// Firebase project configuration (loaded from environment variables)
const firebaseConfig = {
  apiKey: ENV.FIREBASE_API_KEY,
  authDomain: ENV.FIREBASE_AUTH_DOMAIN,
  projectId: ENV.FIREBASE_PROJECT_ID,
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId: ENV.FIREBASE_APP_ID,
  measurementId: ENV.FIREBASE_MEASUREMENT_ID,
}

// Check if Firebase app is already initialized
const existingApps = getApps()
// Initialize app only once
const app = existingApps.length === 0 ? initializeApp(firebaseConfig) : getApp()
// Initialize Firebase Auth with persistent login
let auth: Auth
try {
  // Dynamically load getReactNativePersistence to avoid the TypeScript
  // compile-time error on Firebase v12 — it exists at runtime via Metro.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getReactNativePersistence } = require('firebase/auth')
  if (getReactNativePersistence) {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  } else {
    auth = getAuth(app)
  }
} catch (error) {
  auth = getAuth(app)
}

const db = getFirestore(app)
const storage = getStorage(app)
// Export Firebase services
export { app, auth, db, storage }
