// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  initializeAuth, indexedDBLocalPersistence, browserLocalPersistence,
  browserPopupRedirectResolver, GoogleAuthProvider
} from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAy78uI_2E8yWh8IUMk-tMhycQ1lkGi2gE",
  authDomain: "homechores-92007.firebaseapp.com",
  projectId: "homechores-92007",
  storageBucket: "homechores-92007.firebasestorage.app",
  messagingSenderId: "162987879511",
  appId: "1:162987879511:web:a05a076efcb96f295d4712",
  measurementId: "G-CFTXPX5N75"
};

const app = initializeApp(firebaseConfig);
// Fall back to localStorage if IndexedDB misbehaves (happens in iOS home-screen apps)
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
});
// Long polling avoids the streaming-connection hangs Safari / iOS home-screen apps sometimes hit
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });
export const googleProvider = new GoogleAuthProvider();
