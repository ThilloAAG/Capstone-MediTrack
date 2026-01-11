// app/doctor/patients/index.tsx
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
import { router } from "expo-router";

import { auth, db } from "../../../src/firebase";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";

type DoctorPatientLink = {
  patientId?: string; // parfois tu peux mettre patientId, parfois docId = patientId
  addedAt?: Timestamp;
  note?: string;
};

type PatientProfile = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
};

export default function DoctorPatientsScreen() {
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: undefined | (() => void);

    const run = async () => {
      const doctorUid = auth.currentUser?.uid;
      if (!doctorUid) {
        router.replace("/auth/login");
        return;
      }

      try {
        // Source of truth: doctors/{doctorUid}/patients/{patientId}
        const linkRef = collection(db, "doctors", doctorUid, "patients");
        const q = query(linkRef, orderBy("addedAt", "desc"));

        unsubscribe = onSnapshot(
          q,
          async (snap) => {
            try {
              if (snap.empty) {
                setPatients([]);
                setLoading(false);
                return;
              }

              const links = snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as DoctorPatientLink),
              }));

              // fetch profiles from users/{patientId} in parallel
              const profiles = await Promise.all(
                links.map(async (link) => {
                  const pid = link.patientId || link.id; // fallback doc id
                  try {
                    const userSnap = await getDoc(doc(db, "users", pid));
                    if (!userSnap.exists()) {
                      return { id: pid, name: "Unknown patient", email: pid } as PatientProfile;
                    }
                    const data = userSnap.data() as any;

                    return {
                      id: userSnap.id,
                      name: data?.name ?? "Unnamed patient",
                      email: data?.email ?? userSnap.id,
                      role: data?.role,
                    } as PatientProfile;
                  } catch {
                    return { id: pid, name: "Unknown patient", email: pid } as PatientProfile;
                  }
                })
              );

              setPatients(profiles);
              setLoading(false);
            } catch (e) {
              console.log("Patients mapping error:", e);
              setPatients([]);
              setLoading(false);
            }
          },
          (err) => {
            console.log("Patients fetch error:", err);
            setPatients([]);
            setLoading(false);
          }
        );
      } catch (e) {
        console.log("Patients setup error:", e);
        setPatients([]);
        setLoading(false);
      }
    };

    run();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const total = patients.length;

  const handleOpenPatient = (id: string) => {
    router.push(`/doctor/patients/${id}`);
  };

  const emptyState = useMemo(() => {
    if (loading) return null;
    if (patients.length > 0) return null;

    return (
      <View style={styles.empty}>
        <Ionicons name="people-outline" size={52} color="#94a3b8" />
        <Text style={styles.emptyTitle}>No patients yet</Text>
        <Text style={styles.emptyText}>
          Add a patient using the “+” button,{"\n"}
          or create a link in Firestore under{"\n"}
          doctors/{`{doctorId}`}/patients/{`{patientId}`}
        </Text>
      </View>
    );
  }, [loading, patients.length]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.wrapper}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>Patients</Text>

          {/* Right icons */}
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Info",
                  "This page reads doctors/{doctorId}/patients and then fetches users/{patientId}."
                )
              }
              style={styles.iconBtn}
              activeOpacity={0.85}
            >
              <Ionicons name="information-circle-outline" size={22} color="#111827" />
            </TouchableOpacity>

            {/* ✅ Add patient */}
            <TouchableOpacity
              onPress={() => router.push("/doctor/patients/add")}
              style={styles.iconBtn}
              activeOpacity={0.85}
            >
              <Ionicons name="person-add-outline" size={22} color="#13a4ec" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          {/* Stats card */}
          <View style={styles.statsCard}>
            <View>
              <Text style={styles.statsLabel}>Total patients</Text>
              <Text style={styles.statsValue}>{loading ? "…" : total}</Text>
            </View>
            <View style={styles.statsIcon}>
              <Ionicons name="people" size={22} color="#13a4ec" />
            </View>
          </View>

          {/* List */}
          <View style={styles.listCard}>
            {loading ? (
              <View style={{ paddingVertical: 26 }}>
                <ActivityIndicator size="large" color="#13a4ec" />
              </View>
            ) : patients.length === 0 ? (
              emptyState
            ) : (
              patients.map((p, idx) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.row, idx !== patients.length - 1 && styles.rowDivider]}
                  activeOpacity={0.85}
                  onPress={() => handleOpenPatient(p.id)}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(p.name?.[0] || "P").toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{p.name || "Unnamed patient"}</Text>
                    <Text style={styles.sub}>{p.email || p.id}</Text>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
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
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  main: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  statsCard: {
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
  statsLabel: { fontSize: 12, fontWeight: "800", color: "#64748b" },
  statsValue: { marginTop: 4, fontSize: 24, fontWeight: "900", color: "#111827" },
  statsIcon: {
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
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "900", color: "#13a4ec" },

  name: { fontSize: 15, fontWeight: "900", color: "#111827" },
  sub: { marginTop: 2, fontSize: 12, fontWeight: "700", color: "#64748b" },

  empty: { paddingVertical: 30, alignItems: "center" },
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: "900", color: "#111827" },
  emptyText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
  },
});
