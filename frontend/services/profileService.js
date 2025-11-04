import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../src/firebase";


export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const docSnap = await getDoc(userRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("❌ Error fetching user profile:", error);
    throw error;
  }
};


export const updateUserProfile = async (userId, data) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, data, { merge: true });
  } catch (error) {
    console.error("❌ Error updating user profile:", error);
    throw error;
  }
};
