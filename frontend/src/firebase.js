// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBLxkoXNxYLcV8SLyEzxCAq3vtePw1xKMY",
  authDomain: "meditrack-f6141.firebaseapp.com",
  projectId: "meditrack-f6141",
  storageBucket: "meditrack-f6141.firebasestorage.app",
  messagingSenderId: "326160252762",
  appId: "1:326160252762:web:36a594f1620d2c1a8a7d63",
  measurementId: "G-RBWVGLJL14"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app); // <--- Initialize Firestore here

// Export Firestore (db) along with app and analytics if needed elsewhere
export { analytics, app, db }; // <--- Export 'db' for use in other files
