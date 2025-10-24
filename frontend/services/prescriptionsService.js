import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";
import { db } from "../src/firebase";

/** 🔹 Récupérer toutes les prescriptions (une fois) */
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

/** 🔹 Ajouter une prescription */
export const addPrescription = async (userId, prescription) => {
  try {
    const ref = collection(db, `users/${userId}/prescriptions`);
    await addDoc(ref, prescription);
    console.log("Prescription added:", prescription);
  } catch (err) {
    console.error("Error adding prescription:", err);
  }
};

/** 🔹 Modifier une prescription */
export const updatePrescription = async (userId, prescriptionId, updatedData) => {
  try {
    const ref = doc(db, `users/${userId}/prescriptions/${prescriptionId}`);
    await updateDoc(ref, updatedData);
    console.log("Prescription updated:", updatedData);
  } catch (err) {
    console.error("Error updating prescription:", err);
  }
};

/** 🔹 Supprimer une prescription */
export const deletePrescription = async (userId, prescriptionId) => {
  try {
    const ref = doc(db, `users/${userId}/prescriptions/${prescriptionId}`);
    await deleteDoc(ref);
    console.log("Prescription deleted:", prescriptionId);
  } catch (err) {
    console.error("Error deleting prescription:", err);
  }
};

/** 🔹 Souscrire aux prescriptions en temps réel */
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
