import { auth, db } from "../src/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { updateEmail } from "firebase/auth";


export type UpdateDoctorProfileInput = {
  name?: string;
  department?: string;
  bio?: string;
  email?: string;
};

export const doctorProfileService = {
  async getProfile(uid: string) {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      throw new Error("Doctor profile not found");
    }

    return snap.data();
  },

  async updateProfile(uid: string, data: UpdateDoctorProfileInput) {
    const ref = doc(db, "users", uid);

    // 1. Update email in Firebase Auth if changed
    if (data.email && auth.currentUser) {
      await updateEmail(auth.currentUser, data.email);
    }

    // 2. Update Firestore profile
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },
};