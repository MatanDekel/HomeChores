// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
