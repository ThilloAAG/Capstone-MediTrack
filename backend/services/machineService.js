import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/**
 * sendDispenseCommand
 * - userId: id de l'utilisateur
 * - machineId: id de la machine (si plusieurs)
 * - prescriptionId: id de la prescription à délivrer (optionnel si machine a payload)
 * - immediate: boolean
 *
 * Écrit une commande dans la collection `machines/{machineId}/commands`
 * ou `users/{userId}/commands` selon ton architecture. La Cloud Function
 * ou le device va écouter cette collection.
 */
export const sendDispenseCommand = async ({ userId, machineId, prescriptionId, immediate = true, meta = {} }) => {
  try {
    const targetPath = machineId ? `machines/${machineId}/commands` : `users/${userId}/commands`;
    const ref = collection(db, targetPath);
    const payload = {
      type: "DISPENSE",
      prescriptionId: prescriptionId || null,
      immediate: !!immediate,
      meta,
      status: "PENDING", // PENDING -> PROCESSING -> DONE or FAILED
      createdAt: serverTimestamp(),
      requestedBy: userId || null
    };
    const docRef = await addDoc(ref, payload);
    return { success: true, id: docRef.id };
  } catch (err) {
    console.error("sendDispenseCommand error:", err);
    return { success: false, error: err };
  }
};
