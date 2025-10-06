// services/DoctorService.js
import { db } from "../firebase";
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc } from "firebase/firestore";

// Référence à la collection doctor
const doctorCollection = collection(db, "doctor");

// 1. Add a new doctor
export const addDoctor = async (doctorId, doctorData) => {
  try {
    await setDoc(doc(doctorCollection, doctorId), doctorData);
    console.log("✅ Doctor added successfully!");
  } catch (error) {
    console.error("❌ Error adding doctor:", error);
  }
};

// 2. Get infos
export const getDoctor = async (doctorId) => {
  const docRef = doc(doctorCollection, doctorId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

// 3. Get all the doctors
export const getAllDoctors = async () => {
  const querySnapshot = await getDocs(doctorCollection);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// 4. Update a doctor
export const updateDoctor = async (doctorId, newData) => {
  const docRef = doc(doctorCollection, doctorId);
  await updateDoc(docRef, newData);
  console.log("✅ Doctor updated!");
};

// 5. Delete a doctor
export const deleteDoctor = async (doctorId) => {
  const docRef = doc(doctorCollection, doctorId);
  await deleteDoc(docRef);
  console.log("🗑️ Doctor deleted!");
};
