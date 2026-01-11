// src/services/doctorPatients.ts
import { auth, db } from "../firebase";
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

/**
 * Find a user by email in users collection.
 * Returns uid if found, otherwise null.
 */
export async function findUserIdByEmail(email: string): Promise<string | null> {
  const cleanEmail = (email ?? "").trim().toLowerCase();
  if (!cleanEmail) return null;

  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", cleanEmail), limit(1));
  const snap = await getDocs(q);

  if (snap.empty) return null;
  return snap.docs[0].id;
}

/**
 * Link patient to current doctor:
 * doctors/{doctorUid}/patients/{patientUid}
 */
export async function addPatientToDoctorByEmail(params: {
  patientEmail: string;
  note?: string;
}): Promise<{ patientId: string }> {
  const doctorUid = auth.currentUser?.uid;
  if (!doctorUid) throw new Error("Not authenticated");

  const patientEmail = (params.patientEmail ?? "").trim().toLowerCase();
  if (!patientEmail) throw new Error("Patient email is required");

  // Find patient UID by email
  const patientId = await findUserIdByEmail(patientEmail);
  if (!patientId) throw new Error("No user found with this email");

  // Create link doc
  await setDoc(
    doc(db, "doctors", doctorUid, "patients", patientId),
    {
      patientId,
      patientEmail,
      note: (params.note ?? "").trim() || null,
      addedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { patientId };
}

/**
 * ✅ DEFAULT EXPORT (fix Metro "default-only" behavior)
 * This guarantees the functions are available through `.default`
 */
const doctorPatients = {
  findUserIdByEmail,
  addPatientToDoctorByEmail,
};

export default doctorPatients;
