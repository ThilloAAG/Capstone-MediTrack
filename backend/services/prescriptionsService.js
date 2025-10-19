import { collection, getDocs, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Get prescriptions once (read-only).
 * Returns array of { id, name, dosage, schedule: [...], imageUrl, nextDoseAt, ... }
 */
export const getPrescriptions = async (userId) => {
  if (!userId) return [];
  try {
    const q = query(collection(db, `users/${userId}/prescriptions`), orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("getPrescriptions error:", err);
    return [];
  }
};

/**
 * Subscribe to prescriptions changes in real-time (read-only).
 * callback receives array of prescriptions.
 * Returns unsubscribe function.
 */
export const subscribeToPrescriptions = (userId, callback) => {
  if (!userId) return () => {};
  const q = query(collection(db, `users/${userId}/prescriptions`), orderBy("nextDoseAt"));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const prescriptions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(prescriptions);
  }, (err) => {
    console.error("subscribeToPrescriptions error:", err);
    callback([]);
  });
  return unsubscribe;
};
