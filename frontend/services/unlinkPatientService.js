// frontend/services/unlinkPatientService.js
import { db } from "../src/firebase";
import { doc, deleteDoc } from "firebase/firestore";

export const unlinkPatient = async (patientId, doctorId) => {
    try {
        const linkDocId = `${patientId}_${doctorId}`; // ✅ underscore-only
        await deleteDoc(doc(db, "doctorPatientLinks", linkDocId));
        console.log("✅ Patient", patientId, "unlinked from doctor", doctorId);
    } catch (error) {
        console.log("❌ Unlink patient error:", error);
        throw new Error(error?.message || "Failed to unlink patient");
    }
};

