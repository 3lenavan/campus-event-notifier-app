// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDjVEew9tl7bP3VQhLGqmE7iGd3ve_d7ds",
  authDomain: "campus-event-notifier-app.firebaseapp.com",
  projectId: "campus-event-notifier-app",
  storageBucket: "campus-event-notifier-app.firebasestorage.app",
  messagingSenderId: "557903503131",
  appId: "1:557903503131:web:2beba26832526330aa7dbe",
  // measurementId is not needed for React Native
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export the auth and db instances so other files can use them
export { auth, db };