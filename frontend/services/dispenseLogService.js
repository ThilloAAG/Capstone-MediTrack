import { addMinutes, format, subDays } from "date-fns";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../src/firebase";

/**
 * @typedef {"pending"|"taken"|"missed"} DispenseStatus
 */

/**
 * @typedef {{
 *   id: string,
 *   patientId: string,
 *   prescriptionId: string,
 *   medicationName?: string,
 *   dosage?: string,
 *   scheduledFor?: any,
 *   scheduledKey?: string,
 *   expiresAt?: any,
 *   status: DispenseStatus,
 *   takenAt?: any,
 *   missedAt?: any
 * }} DispenseLog
 */

/**
 * @typedef {{
 *   taken: number,
 *   missed: number,
 *   pending: number,
 *   totalCompleted: number,
 *   adherencePct: number,
 *   risk: "low"|"medium"|"high",
 *   recentLogs: DispenseLog[]
 * }} PrescriptionAdherence
 */

export function makeDoseKey(date) {
  return format(date, "yyyy-MM-dd_HH:mm");
}

export function makeDoseLogId(patientId, prescriptionId, scheduledTime) {
  return `${patientId}_${prescriptionId}_${makeDoseKey(scheduledTime)}`;
}

function mapLog(docSnap) {
  return { id: docSnap.id, ...(docSnap.data() || {}) };
}

function summarizeLogs(logs) {
  const taken = logs.filter((l) => l.status === "taken").length;
  const missed = logs.filter((l) => l.status === "missed").length;
  const pending = logs.filter((l) => l.status === "pending").length;
  const totalCompleted = taken + missed;
  const adherencePct =
    totalCompleted === 0 ? 100 : Math.round((taken / totalCompleted) * 100);

  let risk = "low";
  if (missed >= 3 || adherencePct < 70) risk = "high";
  else if (missed >= 1 || adherencePct < 85) risk = "medium";

  return {
    taken,
    missed,
    pending,
    totalCompleted,
    adherencePct,
    risk,
    recentLogs: logs,
  };
}

/**
 * Creates the pending dispense log for one dose window if it does not exist yet.
 * @param {{
 *   patientId: string,
 *   prescriptionId: string,
 *   scheduledTime: Date,
 *   medicationName?: string,
 *   dosage?: string,
 *   doctorId?: string | null
 * }} params
 * @returns {Promise<{id: string, scheduledKey: string}>}
 */
export async function ensurePendingDoseLog(params) {
  const {
    patientId,
    prescriptionId,
    scheduledTime,
    medicationName = "",
    dosage = "",
    doctorId = null,
  } = params;

  const scheduledKey = makeDoseKey(scheduledTime);
  const logId = makeDoseLogId(patientId, prescriptionId, scheduledTime);
  const ref = doc(db, "dispenseLogs", logId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(
      ref,
      {
        patientId,
        prescriptionId,
        medicationName,
        dosage,
        doctorId,
        scheduledFor: Timestamp.fromDate(scheduledTime),
        scheduledKey,
        expiresAt: Timestamp.fromDate(addMinutes(scheduledTime, 3)),
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  return { id: logId, scheduledKey };
}

/**
 * Marks a dose as taken by patient.
 * @param {{
 *   patientId: string,
 *   prescriptionId: string,
 *   scheduledTime: Date,
 *   medicationName?: string,
 *   dosage?: string,
 *   doctorId?: string | null
 * }} params
 * @returns {Promise<DispenseStatus>}
 */
export async function markDoseTaken(params) {
  const user = auth.currentUser;
  if (!user || user.uid !== params.patientId) {
    throw new Error("Not authorized.");
  }

  const { patientId, prescriptionId, scheduledTime } = params;
  const logId = makeDoseLogId(patientId, prescriptionId, scheduledTime);
  const ref = doc(db, "dispenseLogs", logId);

  await ensurePendingDoseLog(params);

  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error("Dose log could not be created.");
  }

  const data = snap.data() || {};
  if (data.status !== "pending") {
    return data.status;
  }

  await updateDoc(ref, {
    status: "taken",
    takenAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return "taken";
}

/**
 * @param {string} patientId
 * @param {(logs: DispenseLog[]) => void} onChange
 * @param {number} days
 * @returns {() => void}
 */
export function subscribePatientDispenseHistory(patientId, onChange, days = 30) {
  const since = Timestamp.fromDate(subDays(new Date(), days));

  const q = query(
    collection(db, "dispenseLogs"),
    where("patientId", "==", patientId),
    where("scheduledFor", ">=", since),
    orderBy("scheduledFor", "desc"),
    limit(500)
  );

  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map(mapLog));
  });
}

/**
 * Used by patient dashboard for visible recent windows.
 * @param {string} patientId
 * @param {(logs: DispenseLog[]) => void} onChange
 * @returns {() => void}
 */
export function subscribePatientRecentDispenseLogs(patientId, onChange) {
  const since = Timestamp.fromDate(subDays(new Date(), 2));

  const q = query(
    collection(db, "dispenseLogs"),
    where("patientId", "==", patientId),
    where("scheduledFor", ">=", since),
    orderBy("scheduledFor", "desc"),
    limit(300)
  );

  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map(mapLog));
  });
}

/**
 * @param {string} patientId
 * @param {string} prescriptionId
 * @param {(summary: PrescriptionAdherence) => void} onChange
 * @param {number} days
 * @returns {() => void}
 */
export function subscribePrescriptionAdherence(
  patientId,
  prescriptionId,
  onChange,
  days = 30
) {
  const since = Timestamp.fromDate(subDays(new Date(), days));

  const q = query(
    collection(db, "dispenseLogs"),
    where("patientId", "==", patientId),
    where("prescriptionId", "==", prescriptionId),
    where("scheduledFor", ">=", since),
    orderBy("scheduledFor", "desc"),
    limit(300)
  );

  return onSnapshot(q, (snap) => {
    const logs = snap.docs.map(mapLog);
    onChange(summarizeLogs(logs));
  });
}

/**
 * @param {string} patientId
 * @returns {Promise<Record<string, number>>}
 */
export async function getPatientWeeklyMissedCounts(patientId) {
  const since = Timestamp.fromDate(subDays(new Date(), 7));

  const q = query(
    collection(db, "dispenseLogs"),
    where("patientId", "==", patientId),
    where("status", "==", "missed"),
    where("scheduledFor", ">=", since),
    orderBy("scheduledFor", "desc"),
    limit(500)
  );

  const snap = await getDocs(q);
  /** @type {Record<string, number>} */
  const counts = {};

  snap.docs.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const rxId = String(data.prescriptionId || "");
    if (!rxId) return;
    counts[rxId] = (counts[rxId] || 0) + 1;
  });

  return counts;
}

/**
 * @param {string} doctorId
 * @returns {Promise<{
 *   patientRiskMap: Record<string, { missedCount: number, isHighRisk: boolean, level: "low"|"medium"|"high" }>,
 *   highRiskCount: number
 * }>}
 */
export async function getDoctorWeeklyRisk(doctorId) {
  const linkQ = query(
    collection(db, "doctorPatientLinks"),
    where("doctorId", "==", doctorId),
    where("status", "==", "active")
  );

  const linkSnap = await getDocs(linkQ);
  const patientIds = linkSnap.docs
    .map((d) => d.data()?.patientId)
    .filter(Boolean);

  /** @type {Record<string, { missedCount: number, isHighRisk: boolean, level: "low"|"medium"|"high" }>} */
  const patientRiskMap = {};

  await Promise.all(
    patientIds.map(async (patientId) => {
      const missedCounts = await getPatientWeeklyMissedCounts(patientId);
      const missedCount = Object.values(missedCounts).reduce(
        (sum, n) => sum + Number(n || 0),
        0
      );

      let level = "low";
      if (missedCount >= 3) level = "high";
      else if (missedCount >= 1) level = "medium";

      patientRiskMap[patientId] = {
        missedCount,
        isHighRisk: level === "high",
        level,
      };
    })
  );

  const highRiskCount = Object.values(patientRiskMap).filter(
    (v) => v.isHighRisk
  ).length;

  return { patientRiskMap, highRiskCount };
}
