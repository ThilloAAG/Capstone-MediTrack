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
import { formatYYYYMMDD, parseDateEnd, parseDateStart } from "./prescriptionStatus";

// ============================================================
// MISSED DOSE SERVICE (Doctor-Patient Integration)
// ============================================================

const JS_DAY_TO_LABEL = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

function normalizeHHMM(value) {
  const s = String(value || "").trim();

  const colon = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (colon) {
    const hh = String(Math.min(23, Math.max(0, Number(colon[1])))).padStart(2, "0");
    const mm = String(Math.min(59, Math.max(0, Number(colon[2])))).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  const compact = /^(\d{2})(\d{2})$/.exec(s);
  if (compact) {
    const hh = String(Math.min(23, Math.max(0, Number(compact[1])))).padStart(2, "0");
    const mm = String(Math.min(59, Math.max(0, Number(compact[2])))).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  return "";
}

function getTimes(rx) {
  const fromArray = Array.isArray(rx?.times)
    ? rx.times.map(normalizeHHMM).filter(Boolean)
    : [];

  if (fromArray.length) return fromArray;

  const legacy = normalizeHHMM(rx?.time);
  return legacy ? [legacy] : [];
}

function dayMatches(rx, date) {
  const ft = String(rx?.frequencyType || "DAILY").toUpperCase();
  if (ft !== "WEEKLY") return true;

  const selected = Array.isArray(rx?.daysOfWeek) ? rx.daysOfWeek : [];
  return selected.includes(JS_DAY_TO_LABEL[date.getDay()]);
}

function completedSet(rx) {
  return new Set(
    (Array.isArray(rx?.dosesCompleted) ? rx.dosesCompleted : []).map((v) =>
      String(v).trim()
    )
  );
}

function hasCompletedDose(completed, dateStr, hhmm, timesCountForDay) {
  if (completed.has(`${dateStr}|${hhmm}`)) return true;
  if (completed.has(`${dateStr}_${hhmm}`)) return true;
  if (completed.has(`${dateStr} ${hhmm}`)) return true;
  if (completed.has(`${dateStr}T${hhmm}`)) return true;

  // legacy fallback if app stored only the date and there was one dose that day
  if (timesCountForDay === 1 && completed.has(dateStr)) return true;

  return false;
}

function atTime(base, hhmm) {
  const [h, m] = String(hhmm || "00:00")
    .split(":")
    .map(Number);

  const d = new Date(base);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

export function getPrescriptionMissedCountPast7Days(rx, now = new Date()) {
  const start = parseDateStart(String(rx?.startDate || ""));
  const end = parseDateEnd(String(rx?.endDate || ""));

  if (!start || !end) return 0;

  const times = getTimes(rx);
  if (!times.length) return 0;

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const rangeStart = new Date(Math.max(start.getTime(), sevenDaysAgo.getTime()));
  const rangeEnd = new Date(Math.min(end.getTime(), now.getTime()));

  if (rangeEnd.getTime() < rangeStart.getTime()) return 0;

  const completed = completedSet(rx);
  let missed = 0;

  const cursor = new Date(rangeStart);
  cursor.setHours(0, 0, 0, 0);

  while (cursor.getTime() <= rangeEnd.getTime()) {
    if (dayMatches(rx, cursor)) {
      const dateStr = formatYYYYMMDD(cursor);

      for (const hhmm of times) {
        const scheduled = atTime(cursor, hhmm);

        if (scheduled.getTime() < start.getTime()) continue;
        if (scheduled.getTime() > end.getTime()) continue;
        if (scheduled.getTime() > now.getTime()) continue;

        if (!hasCompletedDose(completed, dateStr, hhmm, times.length)) {
          missed += 1;
        }
      }
    }

    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(0, 0, 0, 0);
  }

  return missed;
}

export function patientHasHighRiskMissedPrescription(
  prescriptions,
  now = new Date()
) {
  return (Array.isArray(prescriptions) ? prescriptions : []).some(
    (rx) => getPrescriptionMissedCountPast7Days(rx, now) >= 3
  );
}

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
            const scheduledTime =
              dose.scheduledTime?.toDate?.() || dose.scheduledTime;

            // Mark dose as missed
            await updateDoc(doseDoc.ref, {
              status: "missed",
              missedAt: serverTimestamp(),
            });

            // Get patient info
            const patientDoc = await getDocs(
              query(collection(db, "users"), where("uid", "==", pid))
            );
            const patientName = patientDoc.docs[0]?.data()?.name || "Patient";

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

  /**
   * Prescription-level helper for doctor UI:
   * number of missed scheduled doses in the past 7 days
   */
  getPrescriptionMissedCountPast7Days: (rx, now = new Date()) => {
    return getPrescriptionMissedCountPast7Days(rx, now);
  },

  /**
   * Patient-level helper for doctor dashboard:
   * true if patient has at least one prescription with missed count >= 3
   */
  patientHasHighRiskMissedPrescription: (prescriptions, now = new Date()) => {
    return patientHasHighRiskMissedPrescription(prescriptions, now);
  },
};