import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../src/firebase";

/** Récupère le profil utilisateur */
export const getUserProfile = async (uid) => {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("Error fetching profile:", err);
    return null;
  }
};

/** Met à jour les infos utilisateur */
export const updateUserProfile = async (uid, data) => {
  try {
    const ref = doc(db, "users", uid);
    await updateDoc(ref, data);
  } catch (err) {
    console.error("Error updating profile:", err);
  }
};