// notifier le médecin
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/**
 * sendEmergencyAlert
 * - userId: id de l'utilisateur qui déclenche
 * - doctorId: id du médecin / contact
 * - message: texte additionnel
 *
 * Crée:
 * - une notification côté médecin
 * - une notification côté patient / historique
 *
 * Une Cloud Function peut écouter la collection `doctorNotifications` pour
 * envoyer un e-mail / push FCM.
 */
export const sendEmergencyAlert = async ({ userId, doctorId, message = "" }) => {
  try {
    // 1) ajouter notification chez le docteur
    if (doctorId) {
      await addDoc(collection(db, `doctors/${doctorId}/notifications`), {
        type: "EMERGENCY",
        fromUser: userId || null,
        message,
        read: false,
        createdAt: serverTimestamp()
      });
    }

    // 2) ajouter historique côté user
    await addDoc(collection(db, `users/${userId}/notifications`), {
      type: "EMERGENCY_SENT",
      message,
      doctorId: doctorId || null,
      createdAt: serverTimestamp()
    });

    return { success: true };
  } catch (err) {
    console.error("sendEmergencyAlert error:", err);
    return { success: false, error: err };
  }
};
