import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../../../src/firebase";
import {
  formatCompliancePct,
  listenPrescriptionAdherence,
  missedBadgeDanger,
  type PrescriptionAdherenceMap,
} from "../../../../services/adherenceService";

type Prescription = {
  id: string;
  medicationName?: string;
  dosage?: string;
  notes?: string | null;
  frequency?: string;
  timesPerDay?: number | null;
  frequencyType?: "DAILY" | "WEEKLY";
  times?: string[];
  daysOfWeek?: string[];
  startDate?: string | null;
  endDate?: string | null;
  status?: "active" | "suspended" | "completed" | string;
  doctorId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

function formatTs(ts?: Timestamp) {
  try {
    if (!ts) return "";
    return ts.toDate().toLocaleString();
  } catch {
    return "";
  }
}

export default function DoctorPatientPrescriptionsScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const patientId = useMemo(
    () => (Array.isArray(params.id) ? params.id[0] : params.id),
    [params.id]
  );

  const [patientName, setPatientName] = useState("");
  const [loading, setLoading] = useState(true);
  const [linkError, setLinkError] = useState(false);
  const [items, setItems] = useState<Prescription[]>([]);
  const [adherenceMap, setAdherenceMap] = useState<PrescriptionAdherenceMap>({});

  useEffect(() => {
    if (!patientId) return;

    const unsubAdherence = listenPrescriptionAdherence(patientId, setAdherenceMap);
    let unsubRx: undefined | (() => void);

    const run = async () => {
      try {
        const doctorUid = auth.currentUser?.uid;
        if (!doctorUid) {
          router.replace("/auth/login");
          return;
        }

        const linkDocId = `${patientId}_${doctorUid}`;
        const linkSnap = await getDoc(doc(db, "doctorPatientLinks", linkDocId));

        if (!linkSnap.exists() || (linkSnap.data() as any)?.status !== "active") {
          setLinkError(true);
          setItems([]);
          setLoading(false);
          Alert.alert("Not linked", "This patient is not linked to your doctor account.");
          return;
        }

        setLinkError(false);

        try {
          const userSnap = await getDoc(doc(db, "users", patientId));
          if (userSnap.exists()) {
            const data = userSnap.data() as any;
            setPatientName(data?.name ?? data?.fullName ?? "");
          }
        } catch {}

        const ref = collection(db, "prescriptions", patientId, "userPrescriptions");
        const q = query(ref, orderBy("createdAt", "desc"));

        unsubRx = onSnapshot(
          q,
          (snap) => {
            const list = snap.docs.map(
              (d) => ({ id: d.id, ...(d.data() as any) } as Prescription)
            );
            setItems(list);
            setLoading(false);
          },
          () => {
            setItems([]);
            setLoading(false);
          }
        );
      } catch {
        setItems([]);
        setLoading(false);
      }
    };

    run();

    return () => {
      unsubAdherence();
      if (unsubRx) unsubRx();
    };
  }, [patientId]);

  const title = patientName ? `${patientName} Prescriptions` : "Prescriptions";
  const highRiskCount = items.filter((p) =>
    missedBadgeDanger(adherenceMap[p.id]?.missed7d)
  ).length;

  const scheduleText = (p: Prescription) => {
    if (p.frequencyType === "WEEKLY") return "Weekly";
    const t = p.timesPerDay ?? (Array.isArray(p.times) ? p.times.length : 1);
    return `Daily • ${t}/day`;
  };

  const StatusPill = ({ status }: { status?: string }) => {
    const s = String(status ?? "active").toLowerCase();
    const color =
      s === "active" ? "#22c55e" : s === "suspended" ? "#f59e0b" : "#64748b";

    return (
      <View style={[styles.pill, { backgroundColor: `${color}22` }]}>
        <Text style={[styles.pillText, { color }]}>{s.toUpperCase()}</Text>
      </View>
    );
  };

  const MissedPill = ({ count }: { count: number }) => {
    const danger = missedBadgeDanger(count);

    return (
      <View
        style={[
          styles.missedPill,
          danger ? styles.missedPillDanger : styles.missedPillSafe,
        ]}
      >
        <Text
          style={[
            styles.missedPillText,
            danger ? styles.missedPillTextDanger : styles.missedPillTextSafe,
          ]}
        >
          Missed: {count}
        </Text>
      </View>
    );
  };

  if (linkError && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Ionicons name="lock-closed-outline" size={52} color="#ef4444" />
          <Text style={styles.errorTitle}>Not Linked</Text>
          <Text style={styles.errorText}>
            This patient is not linked to your doctor account.
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>

        <Text numberOfLines={1} style={styles.headerTitle}>
          {title}
        </Text>

        <TouchableOpacity
          onPress={() =>
            patientId &&
            router.push({
              pathname: "/doctor/patients/[id]/new-prescription",
              params: { id: patientId },
            })
          }
          style={styles.iconBtn}
        >
          <Ionicons name="add" size={22} color="#13a4ec" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total prescriptions</Text>
            <Text style={styles.summaryValue}>{loading ? "..." : items.length}</Text>
          </View>

          <View style={[styles.summaryCard, highRiskCount > 0 && styles.summaryCardDanger]}>
            <Text
              style={[
                styles.summaryLabel,
                highRiskCount > 0 && styles.summaryLabelDanger,
              ]}
            >
              High risk prescriptions
            </Text>
            <Text
              style={[
                styles.summaryValue,
                highRiskCount > 0 && styles.summaryValueDanger,
              ]}
            >
              {loading ? "..." : highRiskCount}
            </Text>
          </View>
        </View>

        <View style={styles.listCard}>
          {loading ? (
            <View style={{ paddingVertical: 26 }}>
              <ActivityIndicator size="large" color="#13a4ec" />
            </View>
          ) : items.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={52} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No prescriptions yet</Text>
              <Text style={styles.emptyText}>
                Tap the button to create the first prescription.
              </Text>
            </View>
          ) : (
            items.map((p, idx) => {
              const missed = Number(adherenceMap[p.id]?.missed7d ?? 0);
              const compliance = Number(adherenceMap[p.id]?.compliancePct7d ?? 0);

              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.row, idx !== items.length - 1 && styles.rowDivider]}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: "/doctor/patients/[id]/prescriptions/[rxId]",
                      params: { id: patientId!, rxId: p.id },
                    })
                  }
                >
                  <View style={styles.leftCol}>
                    <Text style={styles.rxName}>{p.medicationName ?? "Medication"}</Text>
                    <Text style={styles.rxMeta}>
                      {p.dosage ? `${p.dosage} • ${scheduleText(p)}` : scheduleText(p)}
                    </Text>

                    {!!p.startDate && !!p.endDate && (
                      <Text style={styles.rxDates}>
                        Start {p.startDate} • End {p.endDate}
                      </Text>
                    )}

                    <Text style={styles.rxDates}>Created {formatTs(p.createdAt)}</Text>
                  </View>

                  <View style={styles.rightCol}>
                    <StatusPill status={p.status} />
                    <MissedPill count={missed} />
                    <Text style={styles.complianceText}>{formatCompliancePct(compliance)}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f7f8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
  },
  main: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  summaryRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  summaryCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  summaryCardDanger: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  summaryLabel: { fontSize: 12, fontWeight: "800", color: "#64748b" },
  summaryLabelDanger: { color: "#b91c1c" },
  summaryValue: { marginTop: 4, fontSize: 24, fontWeight: "900", color: "#111827" },
  summaryValueDanger: { color: "#dc2626" },
  listCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  leftCol: { flex: 1 },
  rightCol: { alignItems: "flex-end", gap: 8 },
  rxName: { fontSize: 15, fontWeight: "900", color: "#111827" },
  rxMeta: { marginTop: 3, fontSize: 12, fontWeight: "800", color: "#64748b" },
  rxDates: { marginTop: 6, fontSize: 11, fontWeight: "700", color: "#94a3b8" },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: "900" },
  missedPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  missedPillSafe: { backgroundColor: "#dcfce7", borderColor: "#86efac" },
  missedPillDanger: { backgroundColor: "#fee2e2", borderColor: "#fca5a5" },
  missedPillText: { fontSize: 11, fontWeight: "900" },
  missedPillTextSafe: { color: "#166534" },
  missedPillTextDanger: { color: "#dc2626" },
  complianceText: { fontSize: 12, fontWeight: "900", color: "#111827" },
  empty: { paddingVertical: 26, alignItems: "center", paddingHorizontal: 14 },
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: "900", color: "#111827" },
  emptyText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  errorTitle: { marginTop: 16, fontSize: 18, fontWeight: "900", color: "#ef4444" },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    textAlign: "center",
  },
  backBtn: {
    marginTop: 20,
    backgroundColor: "#13a4ec",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  backBtnText: { color: "#fff", fontWeight: "900" },
});