// app/doctor/dashboard/index.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { auth, db } from "../../../src/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

type PatientProfile = {
  id: string;
  name?: string;
  email?: string;
  risk?: "low" | "medium" | "high";
  lastUpdate?: string;
};

type Link = {
  patientId: string;
  doctorId: string;
  status: "pending" | "active" | "rejected";
  acceptedAt?: any;
};

export default function DoctorDashboardScreen() {
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);

  const [activeRx, setActiveRx] = useState(0);
  const [loadingRx, setLoadingRx] = useState(true);

  // ✅ Load ACTIVE linked patients via doctorPatientLinks
  useEffect(() => {
    const doctorUid = auth.currentUser?.uid;
    if (!doctorUid) {
      router.replace("/auth/login");
      return;
    }

    const qLinks = query(
      collection(db, "doctorPatientLinks"),
      where("doctorId", "==", doctorUid),
      where("status", "==", "active"),
      orderBy("acceptedAt", "desc"),
      limit(50)
    );

    const unsub = onSnapshot(
      qLinks,
      async (snap) => {
        try {
          if (snap.empty) {
            setPatients([]);
            setLoadingPatients(false);
            return;
          }

          const links = snap.docs.map((d) => d.data() as Link);

          const profiles = await Promise.all(
            links.map(async (l) => {
              try {
                const userSnap = await getDoc(doc(db, "users", l.patientId));
                if (!userSnap.exists()) {
                  return { id: l.patientId, name: "Unknown patient", email: l.patientId } as PatientProfile;
                }
                const data = userSnap.data() as any;
                return {
                  id: userSnap.id,
                  name: data?.name ?? "Unnamed patient",
                  email: data?.email ?? userSnap.id,
                  risk: data?.risk ?? undefined,
                  lastUpdate: data?.lastUpdate ?? undefined,
                } as PatientProfile;
              } catch {
                return { id: l.patientId, name: "Unknown patient", email: l.patientId } as PatientProfile;
              }
            })
          );

          setPatients(profiles);
          setLoadingPatients(false);
        } catch (e) {
          console.log("Dashboard patients mapping error:", e);
          setPatients([]);
          setLoadingPatients(false);
        }
      },
      (err) => {
        console.log("Dashboard patients fetch error:", err);
        setPatients([]);
        setLoadingPatients(false);
      }
    );

    return () => unsub();
  }, []);

  // ✅ Compute "Active Prescriptions" as total prescriptions for ACTIVE linked patients
  // (No collectionGroup, respects your linkActive() rules)
  useEffect(() => {
    const doctorUid = auth.currentUser?.uid;
    if (!doctorUid) return;

    const run = async () => {
      try {
        setLoadingRx(true);

        if (!patients.length) {
          setActiveRx(0);
          return;
        }

        // Simple count: sum of docs under prescriptions/{patientId}/userPrescriptions
        // (If you add a "status" field later, you can filter per subcollection.)
        const counts = await Promise.all(
          patients.map(async (p) => {
            try {
              const rxSnap = await getDocs(
                query(collection(db, "prescriptions", p.id, "userPrescriptions"), limit(500))
              );
              return rxSnap.size;
            } catch (e) {
              // If link/rules not active, read will fail => count 0 for that patient
              console.log("Rx count error for patient:", p.id, e);
              return 0;
            }
          })
        );

        const total = counts.reduce((sum, n) => sum + n, 0);
        setActiveRx(total);
      } catch (e) {
        console.log("Dashboard activeRx error:", e);
        setActiveRx(0);
      } finally {
        setLoadingRx(false);
      }
    };

    run();
  }, [patients]);

  const totalPatients = patients.length;

  const highRiskCount = useMemo(() => {
    return patients.filter((p) => p.risk === "high").length;
  }, [patients]);

  const badgeColor = (risk?: PatientProfile["risk"]) => {
    if (risk === "high") return "#ef4444";
    if (risk === "medium") return "#f59e0b";
    return "#22c55e";
  };

  const goPatients = () => router.push("/doctor/patients");
  const goProfile = () => router.push("/doctor/settings");
  const goRequests = () => router.push("/doctor/patients/requests");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.wrapper}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={goRequests} activeOpacity={0.85}>
            <Ionicons name="mail-unread-outline" size={22} color="#111618" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Doctor Dashboard</Text>

          <TouchableOpacity style={styles.iconBtn} onPress={goProfile} activeOpacity={0.85}>
            <Ionicons name="person-outline" size={22} color="#111618" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          {/* Overview */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Overview</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#0A84FF18" }]}>
                <Ionicons name="people" size={18} color="#0A84FF" />
              </View>
              <Text style={styles.statValue}>{loadingPatients ? "…" : totalPatients}</Text>
              <Text style={styles.statLabel}>Patients</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#13a4ec20" }]}>
                <Ionicons name="medical" size={18} color="#13a4ec" />
              </View>
              <Text style={styles.statValue}>{loadingRx ? "…" : activeRx}</Text>
              <Text style={styles.statLabel}>Prescriptions</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#ef444416" }]}>
                <Ionicons name="alert-circle" size={18} color="#ef4444" />
              </View>
              <Text style={styles.statValue}>{loadingPatients ? "…" : highRiskCount}</Text>
              <Text style={styles.statLabel}>High Risk</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.primaryAction} onPress={goPatients} activeOpacity={0.85}>
              <Ionicons name="people-outline" size={18} color="#ffffff" />
              <Text style={styles.primaryActionText}>View Patients</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryAction} onPress={goRequests} activeOpacity={0.85}>
              <Ionicons name="mail-outline" size={18} color="#0A84FF" />
              <Text style={styles.secondaryActionText}>Requests</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Patients */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Patients</Text>
            <TouchableOpacity onPress={goPatients} activeOpacity={0.85}>
              <Text style={styles.linkText}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listCard}>
            {loadingPatients ? (
              <View style={{ paddingVertical: 26 }}>
                <ActivityIndicator size="large" color="#13a4ec" />
              </View>
            ) : patients.length === 0 ? (
              <View style={{ padding: 18 }}>
                <Text style={{ fontWeight: "900", color: "#111618" }}>No active patients</Text>
                <Text style={{ marginTop: 6, color: "#6b7280", fontWeight: "600" }}>
                  Patients must send you a request, then accept it in Requests.
                </Text>
              </View>
            ) : (
              patients.slice(0, 4).map((p, index) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.patientRow,
                    index !== Math.min(3, patients.length - 1) && styles.rowDivider,
                  ]}
                  onPress={() => router.push(`/doctor/patients/${p.id}`)}
                  activeOpacity={0.85}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(p.name?.[0] || "P").toUpperCase()}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.patientName}>{p.name || "Unnamed patient"}</Text>
                    <Text style={styles.patientMeta}>{p.email || p.id}</Text>
                  </View>

                  <View style={styles.rightCol}>
                    <View style={[styles.badge, { backgroundColor: badgeColor(p.risk) + "20" }]}>
                      <Text style={[styles.badgeText, { color: badgeColor(p.risk) }]}>
                        {(p.risk ? p.risk.toUpperCase() : "OK") as string}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#9aa6b2" />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={{ height: 90 }} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f6f7f8cc",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111618",
    flex: 1,
    textAlign: "center",
  },

  main: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  sectionHeader: { marginTop: 4, marginBottom: 10 },
  sectionHeaderRow: {
    marginTop: 6,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#111618" },
  linkText: { fontSize: 13, fontWeight: "800", color: "#0A84FF" },

  statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  statValue: { fontSize: 22, fontWeight: "900", color: "#111618" },
  statLabel: { fontSize: 12, fontWeight: "700", color: "#6b7280", marginTop: 2 },

  actionsRow: { flexDirection: "row", gap: 12, marginBottom: 18 },
  primaryAction: {
    flex: 1,
    height: 48,
    borderRadius: 22,
    backgroundColor: "#0A84FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryActionText: { color: "#ffffff", fontSize: 14, fontWeight: "900" },
  secondaryAction: {
    flex: 1,
    height: 48,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  secondaryActionText: { color: "#0A84FF", fontSize: 14, fontWeight: "900" },

  listCard: { backgroundColor: "#ffffff", borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: "#f1f5f9" },
  patientRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#f2f3f5", alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { fontWeight: "900", color: "#617c89" },
  patientName: { fontSize: 15, fontWeight: "900", color: "#111618" },
  patientMeta: { fontSize: 12, fontWeight: "600", color: "#6b7280", marginTop: 2 },
  rightCol: { alignItems: "flex-end", gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "900" },
});
