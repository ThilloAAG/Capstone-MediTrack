// app/doctor/patients/[id].tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { auth, db } from "../../../src/firebase";
import { doc, getDoc } from "firebase/firestore";
import DoctorBottomNav from "../../../components/DoctorBottomNav";

type Patient = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
};

export default function DoctorPatientDetail() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const patientId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id) || "", [params.id]);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          router.replace("/auth/login");
          return;
        }

        if (!patientId) {
          setPatient(null);
          return;
        }

        const snap = await getDoc(doc(db, "users", patientId));
        if (!snap.exists()) {
          setPatient(null);
          return;
        }

        setPatient({ id: snap.id, ...(snap.data() as any) });
      } catch (e) {
        console.log("Patient detail error:", e);
        setPatient(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [patientId]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.wrapper}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Patient</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={{ paddingTop: 50 }}>
              <ActivityIndicator size="large" color="#13a4ec" />
            </View>
          ) : !patient ? (
            <View style={styles.empty}>
              <Ionicons name="alert-circle-outline" size={44} color="#ef4444" />
              <Text style={styles.emptyTitle}>Patient not found</Text>
            </View>
          ) : (
            <>
              <View style={styles.profileCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(patient.name?.[0] || "P").toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{patient.name || "Unnamed patient"}</Text>
                  <Text style={styles.sub}>{patient.email || patient.id}</Text>
                </View>
              </View>

              <View style={styles.actionsCard}>
                <Text style={styles.sectionTitle}>Quick actions</Text>

                <TouchableOpacity
                  style={styles.actionRow}
                  activeOpacity={0.85}
                  onPress={() => {
                    Alert.alert("Coming soon", "We’ll connect this to the patient prescriptions view.");
                  }}
                >
                  <Ionicons name="medical-outline" size={20} color="#13a4ec" />
                  <Text style={styles.actionText}>View prescriptions</Text>
                  <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionRow, { borderBottomWidth: 0 }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    Alert.alert("Coming soon", "We’ll connect this to history / compliance.");
                  }}
                >
                  <Ionicons name="time-outline" size={20} color="#13a4ec" />
                  <Text style={styles.actionText}>View medication history</Text>
                  <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <View style={styles.metaCard}>
                <Text style={styles.metaTitle}>Account</Text>
                <Text style={styles.metaLine}>Role: {patient.role || "-"}</Text>
                <Text style={styles.metaLine}>UID: {patient.id}</Text>
              </View>
            </>
          )}
        </ScrollView>

        <DoctorBottomNav active="patients" />
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
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  main: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  profileCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  avatar: { width: 48, height: 48, borderRadius: 18, backgroundColor: "#e3f5ff", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#13a4ec", fontWeight: "900", fontSize: 18 },
  name: { fontSize: 16, fontWeight: "900", color: "#111827" },
  sub: { fontSize: 12, color: "#64748b", marginTop: 2 },

  actionsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 14, fontWeight: "900", color: "#111827", marginBottom: 10 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  actionText: { flex: 1, fontSize: 14, fontWeight: "700", color: "#111827" },

  metaCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 20,
  },
  metaTitle: { fontSize: 14, fontWeight: "900", color: "#111827", marginBottom: 6 },
  metaLine: { fontSize: 12, color: "#64748b", marginTop: 4 },

  empty: { paddingTop: 60, alignItems: "center" },
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: "900", color: "#111827" },
});
