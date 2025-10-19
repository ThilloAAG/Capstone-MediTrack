// récupérer contact du docteur / profil
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * getUserProfile(userId) -> { name, email, doctorId, ... }
 */
export const getUserProfile = async (userId) => {
  try {
    const ref = doc(db, `users/${userId}`);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("getUserProfile error:", err);
    return null;
  }
};

/**
 * getDoctorContact(doctorId) -> { name, email, phone, fcmToken }
 */
export const getDoctorContact = async (doctorId) => {
  try {
    const ref = doc(db, `doctors/${doctorId}`);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("getDoctorContact error:", err);
    return null;
  }
};
