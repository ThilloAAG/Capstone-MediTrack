import { formatTimeDifference } from "../utils/formatTime";

/**
 * nextDoseFromPrescriptions
 * - prescriptions: array d'objets contenant au moins `schedule` ou `nextDoseAt`
 * - return: objet { prescription, nextDoseAt (Date), humanReadable }
 *
 * Exemple de structure prescription:
 * {
 *   id: 'abc',
 *   name: 'Ibuprofen',
 *   dosage: '2 pills',
 *   nextDoseAt: '2025-10-18T18:00:00Z' // ISO string
 *   // ou schedule: [{ timeOfDay: '08:00', repeatEveryHours: 8, ... }]
 * }
 */
export const nextDoseFromPrescriptions = (prescriptions) => {
  if (!prescriptions || prescriptions.length === 0) return null;

  const now = new Date();

  const candidates = prescriptions
    .map(p => {
      const next = p.nextDoseAt ? new Date(p.nextDoseAt) : null;
      return next ? { prescription: p, nextDoseAt: next } : null;
    })
    .filter(Boolean);

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => a.nextDoseAt - b.nextDoseAt);
  const next = candidates[0];
  return {
    prescription: next.prescription,
    nextDoseAt: next.nextDoseAt,
    humanReadable: formatTimeDifference(next.nextDoseAt)
  };
};
