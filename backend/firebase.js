// backend/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBLxkoXNxYLcV8SLyEzxCAq3vtePw1xKMY",
  authDomain: "meditrack-f6141.firebaseapp.com",
  projectId: "meditrack-f6141",
  storageBucket: "meditrack-f6141.firebasestorage.app",
  messagingSenderId: "326160252762",
  appId: "1:326160252762:web:36a594f1620d2c1a8a7d63",
  measurementId: "G-RBWVGLJL14"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
