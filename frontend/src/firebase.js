// src/firebase.ts (ou .js)
import { Platform } from "react-native";
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyBLxkoXNxYLcV8SLyEzxCAq3vtePw1xKMY",
  authDomain: "meditrack-f6141.firebaseapp.com",
  projectId: "meditrack-f6141",
  storageBucket: "meditrack-f6141.firebasestorage.app",
  messagingSenderId: "326160252762",
  appId: "1:326160252762:web:36a594f1620d2c1a8a7d63",
  measurementId: "G-RBWVGLJL14",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth =
  Platform.OS === "web"
    ? getAuth(app) // Web
    : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) }); // iOS/Android

export { app, db, auth };
