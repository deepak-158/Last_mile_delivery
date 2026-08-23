import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getMessaging, isSupported as isMessagingSupported } from 'firebase/messaging';

// Firebase configuration for lastmiledelivery-b0bdd
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA4GGmEvT2yApRrXdpj3Os8zpRDFoW7JTE',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'lastmiledelivery-b0bdd.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'lastmiledelivery-b0bdd',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'lastmiledelivery-b0bdd.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '596146850741',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:596146850741:web:2bb089d745f8059698a7fc',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-KZG76GYD6J',
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Optional Analytics
if (typeof window !== 'undefined') {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  }).catch(() => {
    // Analytics fallback
  });
}

// Optional Cloud Messaging
export const getFCM = async () => {
  try {
    const supported = await isMessagingSupported();
    if (supported) {
      return getMessaging(app);
    }
  } catch (err) {
    console.warn('FCM messaging is not supported in this browser context:', err);
  }
  return null;
};

export default app;
