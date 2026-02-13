// frontend/services/prescriptionStatus.js
import { Timestamp } from "firebase/firestore";

/**
 * Status rules (date-driven):
 * - suspended  : now < startDate (start-of-day)
 * - active     : startDate <= now <= endDate (end-of-day)
 * - completed  : now > endDate (end-of-day)
 */
export const RX_STATUS = {
  SUSPENDED: "suspended",
  ACTIVE: "active",
  COMPLETED: "completed",
};

export function isValidYYYYMMDD(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

// start-of-day (00:00:00.000)
export function parseDateStart(value) {
  if (!isValidYYYYMMDD(value)) return null;
  const [y, m, d] = String(value).split("-").map(Number);
  const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

// end-of-day (23:59:59.999)
export function parseDateEnd(value) {
  if (!isValidYYYYMMDD(value)) return null;
  const [y, m, d] = String(value).split("-").map(Number);
  const dt = new Date(y, m - 1, d, 23, 59, 59, 999);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function formatYYYYMMDD(date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function computeRxStatus(startDate, endDate, now = new Date()) {
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();
  const nowMs = now.getTime();

  if (nowMs < startMs) return RX_STATUS.SUSPENDED;
  if (nowMs > endMs) return RX_STATUS.COMPLETED;
  return RX_STATUS.ACTIVE;
}

/**
 * Reads from doc fields:
 * - preferred: startDateTs, endDateTs (Firestore Timestamp)
 * - fallback:  startDate/endDate strings (YYYY-MM-DD)
 */
export function computeRxStatusFromDoc(data, now = new Date()) {
  const startTs = data?.startDateTs;
  const endTs = data?.endDateTs;

  const startDate =
    (startTs && typeof startTs.toDate === "function" ? startTs.toDate() : null) ||
    (typeof data?.startDate === "string" ? parseDateStart(data.startDate) : null);

  const endDate =
    (endTs && typeof endTs.toDate === "function" ? endTs.toDate() : null) ||
    (typeof data?.endDate === "string" ? parseDateEnd(data.endDate) : null);

  if (!startDate || !endDate) return null;
  return computeRxStatus(startDate, endDate, now);
}

export function dateStringToTimestampStart(dateStr) {
  const d = parseDateStart(dateStr);
  if (!d) return null;
  return Timestamp.fromDate(d);
}

export function dateStringToTimestampEnd(dateStr) {
  const d = parseDateEnd(dateStr);
  if (!d) return null;
  return Timestamp.fromDate(d);
}
