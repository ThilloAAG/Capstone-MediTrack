import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../src/firebase";
import { doctorNotificationService } from "./doctorNotificationService";
import { doctorNotificationPreferencesService } from "./doctorNotificationPreferencesService";

// ============================================================
// MISSED DOSE SERVICE (Doctor-Patient Integration)
// ============================================================

export const missedDoseService = {
  /**
   * Check for missed doses and create notifications
   * Respects doctor's missed dose alert preferences
   */
  checkMissedDoses: async (doctorId, patientId = null) => {
    try {
      if (!doctorId) throw new Error("Doctor ID is required");

      console.log(
        "⏰ Checking missed doses for doctor:",
        doctorId,
        patientId ? `and patient: ${patientId}` : ""
      );

      // Check if doctor has missed dose alerts enabled
      const isEnabled =
        await doctorNotificationPreferencesService.isNotificationTypeEnabled(
          doctorId,
          "missed"
        );

      if (!isEnabled) {
        console.log(
          "ℹ️ Missed dose alerts disabled for this doctor, skipping check"
        );
        return [];
      }

      // Get all active patients for this doctor
      const linkQuery = query(
        collection(db, "doctorPatientLinks"),
        where("doctorId", "==", doctorId),
        where("status", "==", "active")
      );

      const linkSnapshot = await getDocs(linkQuery);
      const patients = linkSnapshot.docs.map((doc) => doc.data().patientId);

      if (patients.length === 0) {
        console.log("ℹ️ No active patients found");
        return [];
      }

      const missedDoses = [];

      // Check doses for each patient
      for (const pid of patients) {
        // If specific patientId provided, only check that patient
        if (patientId && pid !== patientId) continue;

        try {
          const upcomingDosesRef = collection(
            db,
            "upcomingDoses",
            pid,
            "doses"
          );
          const now = new Date();

          // Query for doses that should have been taken but weren't
          const q = query(
            upcomingDosesRef,
            where("status", "==", "pending"),
            where("scheduledTime", "<=", now)
          );

          const doseSnapshot = await getDocs(q);

          for (const doseDoc of doseSnapshot.docs) {
            const dose = doseDoc.data();
            const scheduledTime = dose.scheduledTime?.toDate?.() || dose.scheduledTime;

            // Mark dose as missed
            await updateDoc(doseDoc.ref, {
              status: "missed",
              missedAt: serverTimestamp(),
            });

            // Get patient info
            const patientDoc = await getDocs(
              query(
                collection(db, "users"),
                where("uid", "==", pid)
              )
            );
            const patientName =
              patientDoc.docs[0]?.data()?.name || "Patient";

            // Create notification (will check preferences again internally)
            const notifData = {
              doctorId,
              patientId: pid,
              patientName,
              medicationName: dose.medicationName || "Medication",
              scheduledTime: scheduledTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              dosage: dose.dosage || "",
              missedTime: new Date(),
            };

            await doctorNotificationService.createMissedDoseNotification(
              doctorId,
              pid,
              notifData
            );

            missedDoses.push(notifData);
          }
        } catch (error) {
          console.error(
            `❌ Error checking doses for patient ${pid}:`,
            error
          );
        }
      }

      console.log(`✅ Found ${missedDoses.length} missed doses`);
      return missedDoses;
    } catch (error) {
      console.error("❌ Error checking missed doses:", error);
      throw error;
    }
  },

  /**
   * Monitor doses in real-time
   * Useful for background monitoring
   */
  monitorMissedDoses: (doctorId, patientId, callback) => {
    try {
      if (!doctorId) throw new Error("Doctor ID is required");
      if (!patientId) throw new Error("Patient ID is required");

      console.log(
        "👁️ Setting up real-time monitoring for:",
        doctorId,
        patientId
      );

      const dosesRef = collection(db, "upcomingDoses", patientId, "doses");
      const q = query(
        dosesRef,
        where("status", "==", "pending"),
        where("scheduledTime", "<=", new Date())
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const missedDoses = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            scheduledTime: doc.data().scheduledTime?.toDate?.(),
          }));

          console.log(`📬 Missed doses update: ${missedDoses.length} doses`);
          if (callback) callback(missedDoses);
        },
        (error) => {
          console.error("❌ Monitoring error:", error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error("❌ Error setting up monitoring:", error);
      throw error;
    }
  },

  /**
   * Get missed doses for a specific patient
   */
  getMissedDoses: async (patientId) => {
    try {
      if (!patientId) throw new Error("Patient ID is required");

      console.log("📋 Getting missed doses for patient:", patientId);

      const dosesRef = collection(db, "upcomingDoses", patientId, "doses");
      const q = query(dosesRef, where("status", "==", "missed"));

      const snapshot = await getDocs(q);
      const missedDoses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        scheduledTime: doc.data().scheduledTime?.toDate?.(),
      }));

      console.log(`✅ Found ${missedDoses.length} missed doses`);
      return missedDoses.sort((a, b) => b.scheduledTime - a.scheduledTime);
    } catch (error) {
      console.error("❌ Error getting missed doses:", error);
      throw error;
    }
  },

  /**
   * Get missed doses for all patients of a doctor
   */
  getDoctorMissedDoses: async (doctorId) => {
    try {
      if (!doctorId) throw new Error("Doctor ID is required");

      console.log("📋 Getting all missed doses for doctor:", doctorId);

      // Get all active patients
      const linkQuery = query(
        collection(db, "doctorPatientLinks"),
        where("doctorId", "==", doctorId),
        where("status", "==", "active")
      );

      const linkSnapshot = await getDocs(linkQuery);
      const patients = linkSnapshot.docs.map((doc) => doc.data().patientId);

      const allMissedDoses = [];

      // Collect missed doses from all patients
      for (const patientId of patients) {
        const doses = await missedDoseService.getMissedDoses(patientId);
        allMissedDoses.push(...doses);
      }

      console.log(`✅ Found ${allMissedDoses.length} total missed doses`);
      return allMissedDoses.sort((a, b) => b.scheduledTime - a.scheduledTime);
    } catch (error) {
      console.error("❌ Error getting doctor missed doses:", error);
      throw error;
    }
  },
};
