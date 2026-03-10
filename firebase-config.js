// firebase-config.js — Single shared Firebase configuration for LexiLearn
// ⚠️ NEVER hardcode Firebase config in individual HTML files — always import from here.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCh_SchV5uMwFfXCgB2GXJ5s5egeE_cDb0",
  authDomain: "lexilearn-acdc6.firebaseapp.com",
  projectId: "lexilearn-acdc6",
  storageBucket: "lexilearn-acdc6.firebasestorage.app",
  messagingSenderId: "308469393475",
  appId: "1:308469393475:web:b1f3d50001191a1c5d0cf6",
  measurementId: "G-5L57V0JW2T"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { doc, getDoc, setDoc, updateDoc, increment, onSnapshot };
export default app;
