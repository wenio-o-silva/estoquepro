import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDxL_zmaaaFPeOc1_Ec8o0W_V5TP9Lq1rs",
  authDomain: "estoquepro-cc637.firebaseapp.com",
  projectId: "estoquepro-cc637",
  storageBucket: "estoquepro-cc637.firebasestorage.app",
  messagingSenderId: "795757459243",
  appId: "1:795757459243:web:fa7600c90f47773747376e"
};

// Initialize Firebase
// getApps().length prevents initializing multiple times in Next.js
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
