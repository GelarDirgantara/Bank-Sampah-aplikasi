import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Konfigurasi rahasia milik project Anda
const firebaseConfig = {
  apiKey: "AIzaSyCJ7-ySU6URiPypDLhXkcxGH4-rGIscIu0",
  authDomain: "bank-sampah-aplikasi.firebaseapp.com",
  projectId: "bank-sampah-aplikasi",
  storageBucket: "bank-sampah-aplikasi.firebasestorage.app",
  messagingSenderId: "76166669608",
  appId: "1:76166669608:web:1ef172d2a2f0ef11b55c1d",
  measurementId: "G-NMFJQBMY2S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
