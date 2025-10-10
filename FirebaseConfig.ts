// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDjVEew9tl7bP3VQhLGqmE7iGd3ve_d7ds",
  authDomain: "campus-event-notifier-app.firebaseapp.com",
  projectId: "campus-event-notifier-app",
  storageBucket: "campus-event-notifier-app.firebasestorage.app",
  messagingSenderId: "557903503131",
  appId: "1:557903503131:web:2beba26832526330aa7dbe",
  measurementId: "G-3367T6WL2J"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
