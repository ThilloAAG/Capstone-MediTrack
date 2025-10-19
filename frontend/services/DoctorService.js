import { db } from "../firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export const addDoctor = async (doctorData) => {
  await addDoc(collection(db, "doctors"), doctorData);
};

export const getAllDoctors = async () => {
  const snapshot = await getDocs(collection(db, "doctors"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
