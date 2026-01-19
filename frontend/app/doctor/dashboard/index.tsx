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
  collectionGroup,
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

type DoctorPatientLink = {
  patientId?: string;
  addedAt?: any;
};

export default function DoctorDashboardScreen() {
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);

  const [activeRx, setActiveRx] = useState(0);
  const [loadingRx, setLoadingRx] = useState(true);

  // ---------- LOAD PATIENTS (REAL) ----------
  useEffect(() => {
    const doctorUid = auth.currentUser?.uid;
    if (!doctorUid) {
      router.replace("/auth/login");
      return;
    }

    const linksRef = collection(db, "doctors", doctorUid, "patients");
    const qLinks = query(linksRef, orderBy("addedAt", "desc"));

    const unsub = onSnapshot(
      qLinks,
      async (snap) => {
        try {
          if (snap.empty) {
            setPatients([]);
            setLoadingPatients(false);
            return;
          }

          const links = snap.docs.map((d) => {
            const data = d.data() as DoctorPatientLink;
            return { docId: d.id, patientId: data.patientId ?? d.id };
          });

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
          console.log("Dashboard patients error:", e);
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

  // ---------- LOAD ACTIVE PRESCRIPTIONS ----------
  useEffect(() => {
    const doctorUid = auth.currentUser?.uid;
    if (!doctorUid) return;

    const run = async () => {
      try {
        setLoadingRx(true);

        const rxQ = query(
          collectionGroup(db, "userPrescriptions"),
          where("doctorId", "==", doctorUid),
          where("status", "==", "active"),
          limit(500)
        );

        const snap = await getDocs(rxQ);
        setActiveRx(snap.size);
      } catch (e) {
        console.log("Dashboard activeRx error:", e);
        setActiveRx(0);
      } finally {
        setLoadingRx(false);
      }
    };

    run();
  }, []);

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
  const goProfile = () => router.push("/doctor/settings"); // route existante

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.wrapper}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.spacer} />
          <Text style={styles.headerTitle}>Doctor Dashboard</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={goProfile} activeOpacity={0.85}>
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
              <Text style={styles.statLabel}>Active Prescriptions</Text>
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
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={goPatients}
              activeOpacity={0.85}
            >
              <Ionicons name="people-outline" size={18} color="#ffffff" />
              <Text style={styles.primaryActionText}>View Patients</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={goProfile}
              activeOpacity={0.85}
            >
              <Ionicons name="person-outline" size={18} color="#0A84FF" />
              <Text style={styles.secondaryActionText}>Profile</Text>
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
                <Text style={{ fontWeight: "900", color: "#111618" }}>No patients yet</Text>
                <Text style={{ marginTop: 6, color: "#6b7280", fontWeight: "600" }}>
                  Link a patient from the Patients tab (Add patient).
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
  spacer: { width: 44 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111618",
    flex: 1,
    textAlign: "center",
    paddingRight: 44,
  },
  settingsButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },

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
