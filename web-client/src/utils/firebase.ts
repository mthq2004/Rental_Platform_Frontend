import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";
import envConfig from "@/config";

const firebaseConfig = {
  apiKey: envConfig.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: envConfig.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envConfig.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: envConfig.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envConfig.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: envConfig.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: envConfig.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

export const getFirebaseApp = () => {
  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return app;
};

export const getFirebaseMessaging = async () => {
  const supported = await isSupported();
  if (!supported) return null;

  getFirebaseApp();
  if (!messaging) {
    messaging = getMessaging();
  }
  return messaging;
};
