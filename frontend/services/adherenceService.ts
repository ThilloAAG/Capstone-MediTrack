import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "../src/firebase";

export type PatientAdherenceSummary = {
  patientId: string;
  last7dMissedTotal: number;
  last7dTakenTotal: number;
  last7dTotal: number;
  last7dCompliancePct: number;
  highRisk: boolean;
  highRiskPrescriptionCount: number;
  riskyPrescriptionIds?: string[];
  updatedAt?: any;
  latestEventAt?: any;
};

export type PrescriptionAdherenceSummary = {
  patientId: string;
  prescriptionId: string;
  missed7d: number;
  taken7d: number;
  total7d: number;
  compliancePct7d: number;
  highRisk: boolean;
  updatedAt?: any;
  lastEventAt?: any;
};

export type PrescriptionAdherenceMap = Record<string, PrescriptionAdherenceSummary>;

export function emptyPatientSummary(patientId: string): PatientAdherenceSummary {
  return {
    patientId,
    last7dMissedTotal: 0,
    last7dTakenTotal: 0,
    last7dTotal: 0,
    last7dCompliancePct: 0,
    highRisk: false,
    highRiskPrescriptionCount: 0,
    riskyPrescriptionIds: [],
  };
}

export function emptyPrescriptionSummary(
  patientId: string,
  prescriptionId: string
): PrescriptionAdherenceSummary {
  return {
    patientId,
    prescriptionId,
    missed7d: 0,
    taken7d: 0,
    total7d: 0,
    compliancePct7d: 0,
    highRisk: false,
  };
}

export function listenPatientAdherenceSummary(
  patientId: string,
  callback: (value: PatientAdherenceSummary) => void
) {
  if (!patientId) {
    callback(emptyPatientSummary(""));
    return () => undefined;
  }

  return onSnapshot(doc(db, "adherenceSummary", patientId), (snap) => {
    if (!snap.exists()) {
      callback(emptyPatientSummary(patientId));
      return;
    }

    callback({
      ...emptyPatientSummary(patientId),
      ...(snap.data() as any),
      patientId,
    });
  });
}

export function listenPrescriptionAdherence(
  patientId: string,
  callback: (value: PrescriptionAdherenceMap) => void
) {
  if (!patientId) {
    callback({});
    return () => undefined;
  }

  return onSnapshot(
    collection(db, "adherenceSummary", patientId, "prescriptions"),
    (snap) => {
      const map: PrescriptionAdherenceMap = {};

      snap.forEach((docSnap) => {
        map[docSnap.id] = {
          ...emptyPrescriptionSummary(patientId, docSnap.id),
          ...(docSnap.data() as any),
          patientId,
          prescriptionId: docSnap.id,
        };
      });

      callback(map);
    }
  );
}

export function formatCompliancePct(value?: number | null): string {
  const safe = Math.max(0, Math.min(100, Math.round(Number(value ?? 0))));
  return `${safe}%`;
}

export function missedBadgeDanger(missed?: number | null): boolean {
  return Number(missed ?? 0) > 3;
}
