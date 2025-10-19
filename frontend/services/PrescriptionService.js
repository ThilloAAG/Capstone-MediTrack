import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export const getPrescriptions = async (userId) => {
  const q = query(collection(db, "prescriptions"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
