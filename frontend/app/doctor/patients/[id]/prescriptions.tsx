import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { auth, db } from "../../../../src/firebase";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";

type Prescription = {
  id: string;
  medicationName?: string;
  dosage?: string;
  notes?: string | null;

  frequency?: "once" | "daily" | "weekly";
  timesPerDay?: number | null;
  startDate?: string | null;
  endDate?: string | null;

  status?: "active" | "paused" | "completed" | string;

  doctorId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

function formatTs(ts?: Timestamp) {
  try {
    if (!ts) return "";
    const d = ts.toDate();
    return d.toLocaleString();
  } catch {
    return "";
  }
}

export default function DoctorPatientPrescriptionsScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const patientId = useMemo(() => {
    if (!params.id) return "";
    return Array.isArray(params.id) ? params.id[0] : params.id;
  }, [params.id]);

  const [patientName, setPatientName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [linkError, setLinkError] = useState(false);
  const [items, setItems] = useState<Prescription[]>([]);

  useEffect(() => {
    let unsub: undefined | (() => void);

    const run = async () => {
      const doctorUid = auth.currentUser?.uid;
      if (!doctorUid) {
        router.replace("/auth/login");
        return;
      }

      if (!patientId) {
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        // 🆕 STEP 1: Verify doctor-patient link exists and is ACTIVE
        const linkDocId = `${patientId}_${doctorUid}`;
        const linkSnap = await getDoc(
          doc(db, "doctorPatientLinks", linkDocId)
        );

        if (!linkSnap.exists() || linkSnap.data()?.status !== "active") {
          console.log(
            "❌ Doctor not linked to this patient or link not active"
          );
          setLinkError(true);
          setItems([]);
          setLoading(false);
          Alert.alert(
            "Not linked",
            "This patient is not linked to your doctor account. Add/link the patient first."
          );
          return;
        }

        setLinkError(false);

        // Optional: load patient name for header context
        try {
          const userSnap = await getDoc(doc(db, "users", patientId));
          if (userSnap.exists()) {
            const data = userSnap.data() as any;
            setPatientName(data?.name ?? "");
          }
        } catch {}

        // STEP 2: Load prescriptions from this patient
        const ref = collection(
          db,
          "prescriptions",
          patientId,
          "userPrescriptions"
        );

        // Most recent first
        const q = query(ref, orderBy("createdAt", "desc"));

        unsub = onSnapshot(
          q,
          (snap) => {
            const list: Prescription[] = snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as any),
            }));
            setItems(list);
            setLoading(false);
          },
          (err) => {
            console.log("❌ Prescriptions fetch error:", err);
            setItems([]);
            setLoading(false);
          }
        );
      } catch (e) {
        console.log("❌ Prescriptions setup error:", e);
        setItems([]);
        setLoading(false);
      }
    };

    run();

    return () => {
      if (unsub) unsub();
    };
  }, [patientId]);

  const title = patientName
    ? `${patientName} · Prescriptions`
    : "Prescriptions";

  const StatusPill = ({ status }: { status?: string }) => {
    const s = (status ?? "active").toLowerCase();
    const color =
      s === "active"
        ? "#22c55e"
        : s === "paused"
        ? "#f59e0b"
        : s === "completed"
        ? "#64748b"
        : "#13a4ec";

    return (
      <View style={[styles.pill, { backgroundColor: color + "22" }]}>
        <Text style={[styles.pillText, { color }]}>{s.toUpperCase()}</Text>
      </View>
    );
  };

  const scheduleText = (p: Prescription) => {
    const freq = p.frequency ?? "daily";
    if (freq === "once") return "Once";
    if (freq === "weekly") return "Weekly";
    // daily default
    const t = p.timesPerDay ?? 1;
    return `Daily · ${t}×/day`;
  };

  // If link error, show error message
  if (linkError || (loading && linkError)) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <View style={styles.wrapper}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.iconBtn}
              activeOpacity={0.85}
            >
              <Ionicons name="chevron-back" size={22} color="#111827" />
            </TouchableOpacity>

            <Text numberOfLines={1} style={styles.headerTitle}>
              {title}
            </Text>

            <View style={{ width: 40 }} />
          </View>

          <View style={styles.errorContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={52}
              color="#ef4444"
            />
            <Text style={styles.errorTitle}>Not Linked</Text>
            <Text style={styles.errorText}>
              This patient is not linked to your doctor account.
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.backBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.wrapper}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <Text numberOfLines={1} style={styles.headerTitle}>
            {title}
          </Text>

          <TouchableOpacity
            onPress={() => {
              if (!patientId) return;
              router.push(`/doctor/patients/${patientId}/new-prescription`);
            }}
            style={styles.iconBtn}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={22} color="#13a4ec" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          {/* Quick summary card */}
          <View style={styles.summaryCard}>
            <View>
              <Text style={styles.summaryLabel}>Total prescriptions</Text>
              <Text style={styles.summaryValue}>
                {loading ? "…" : items.length}
              </Text>
            </View>
            <View style={styles.summaryIcon}>
              <Ionicons name="medical" size={22} color="#13a4ec" />
            </View>
          </View>

          {/* List */}
          <View style={styles.listCard}>
            {loading ? (
              <View style={{ paddingVertical: 26 }}>
                <ActivityIndicator size="large" color="#13a4ec" />
              </View>
            ) : items.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons
                  name="document-text-outline"
                  size={52}
                  color="#94a3b8"
                />
                <Text style={styles.emptyTitle}>No prescriptions yet</Text>
                <Text style={styles.emptyText}>
                  Tap the + button to create the first prescription.
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    if (!patientId) return;
                    router.push(
                      `/doctor/patients/${patientId}/new-prescription`
                    );
                  }}
                  style={styles.primaryBtn}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Add prescription</Text>
                </TouchableOpacity>
              </View>
            ) : (
              items.map((p, idx) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.row,
                    idx !== items.length - 1 && styles.rowDivider,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (!patientId || !p.id) return;
                    router.push(
                      `/doctor/patients/${patientId}/prescriptions/${p.id}`
                    );
                  }}
                >
                  <View style={styles.leftCol}>
                    <Text style={styles.rxName}>
                      {p.medicationName || "Medication"}
                    </Text>
                    <Text style={styles.rxMeta}>
                      {p.dosage ? `${p.dosage} · ` : ""}
                      {scheduleText(p)}
                    </Text>
                    {!!p.startDate || !!p.endDate ? (
                      <Text style={styles.rxDates}>
                        {p.startDate ? `Start: ${p.startDate}` : "Start: —"}
                        {"  "}
                        {p.endDate ? `End: ${p.endDate}` : "End: —"}
                      </Text>
                    ) : (
                      <Text style={styles.rxDates}>
                        Created: {formatTs(p.createdAt) || "—"}
                      </Text>
                    )}
                  </View>

                  <View style={styles.rightCol}>
                    <StatusPill status={p.status} />
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#94a3b8"
                    />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f7f8" },
  wrapper: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
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

  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabel: { fontSize: 12, fontWeight: "800", color: "#64748b" },
  summaryValue: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: "900",
    color: "#111827",
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: "#e3f5ff",
    alignItems: "center",
    justifyContent: "center",
  },

  listCard: {
    backgroundColor: "#ffffff",
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
  rxName: { fontSize: 15, fontWeight: "900", color: "#111827" },
  rxMeta: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
  },
  rxDates: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
  },

  rightCol: { alignItems: "flex-end", gap: 8 },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: { fontSize: 11, fontWeight: "900" },

  empty: {
    paddingVertical: 26,
    alignItems: "center",
    paddingHorizontal: 14,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
  },
  emptyText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
  },

  primaryBtn: {
    marginTop: 14,
    backgroundColor: "#13a4ec",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "900",
    color: "#ef4444",
  },
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
  backBtnText: {
    color: "#fff",
    fontWeight: "900",
  },
});
