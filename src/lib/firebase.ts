import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDjVEew9tl7bP3VQhLGqmE7iGd3ve_d7ds",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "campus-event-notifier-app.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "campus-event-notifier-app",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "campus-event-notifier-app.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "557903503131",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:557903503131:web:2beba26832526330aa7dbe",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
const auth = getAuth(app);

// Debug logging
console.log("🔥 Firebase initialized with config:", {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
});
console.log("🔥 Auth instance created:", !!auth);

// Connect to emulator in development if needed
if (__DEV__ && process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
  try {
    connectAuthEmulator(auth, "http://localhost:9099");
  } catch (error) {
    // Emulator already connected or not available
    console.log("Firebase Auth emulator connection skipped:", error);
  }
}

export { auth };
export default app;
