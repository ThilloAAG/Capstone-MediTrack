// app/doctor/patients/requests.tsx
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
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

type Link = {
  patientId: string;
  doctorId: string;
  status: "pending" | "active" | "rejected";
};

type PatientProfile = {
  id: string;
  name?: string;
  email?: string;
};

export default function DoctorRequestsScreen() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<(Link & { patient?: PatientProfile })[]>([]);

  useEffect(() => {
    const doctorId = auth.currentUser?.uid;
    if (!doctorId) {
      router.replace("/auth/login");
      return;
    }

    const qReq = query(
      collection(db, "doctorPatientLinks"),
      where("doctorId", "==", doctorId),
      where("status", "==", "pending")
    );

    const unsub = onSnapshot(
      qReq,
      async (snap) => {
        try {
          const links = snap.docs.map((d) => d.data() as Link);

          const enriched = await Promise.all(
            links.map(async (l) => {
              try {
                const userSnap = await getDoc(doc(db, "users", l.patientId));
                const data = userSnap.exists() ? (userSnap.data() as any) : null;
                return {
                  ...l,
                  patient: {
                    id: l.patientId,
                    name: data?.name ?? "Unnamed patient",
                    email: data?.email ?? l.patientId,
                  },
                };
              } catch {
                return { ...l, patient: { id: l.patientId, name: "Unknown patient", email: l.patientId } };
              }
            })
          );

          setItems(enriched);
          setLoading(false);
        } catch (e) {
          console.log("Requests mapping error:", e);
          setItems([]);
          setLoading(false);
        }
      },
      (err) => {
        console.log("Requests fetch error:", err);
        setItems([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const accept = async (patientId: string) => {
    const doctorId = auth.currentUser?.uid;
    if (!doctorId) return;

    const linkId = `${patientId}_${doctorId}`;
    try {
      await updateDoc(doc(db, "doctorPatientLinks", linkId), {
        status: "active",
        acceptedAt: serverTimestamp(),
      });
      Alert.alert("Accepted", "Patient link activated ✅");
    } catch (e: any) {
      console.log("Accept error:", e);
      Alert.alert("Error", e?.message || "Failed to accept request.");
    }
  };

  const reject = async (patientId: string) => {
    const doctorId = auth.currentUser?.uid;
    if (!doctorId) return;

    const linkId = `${patientId}_${doctorId}`;
    try {
      await updateDoc(doc(db, "doctorPatientLinks", linkId), {
        status: "rejected",
      });
      Alert.alert("Rejected", "Request rejected.");
    } catch (e: any) {
      console.log("Reject error:", e);
      Alert.alert("Error", e?.message || "Failed to reject request.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Requests</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pending doctor requests</Text>
          <Text style={styles.muted}>
            Accepting a request gives you access to the patient’s prescriptions.
          </Text>
        </View>

        <View style={styles.listCard}>
          {loading ? (
            <View style={{ paddingVertical: 26 }}>
              <ActivityIndicator size="large" color="#13a4ec" />
            </View>
          ) : items.length === 0 ? (
            <View style={{ padding: 16 }}>
              <Text style={{ fontWeight: "900", color: "#111827" }}>No pending requests</Text>
              <Text style={{ marginTop: 6, color: "#64748b", fontWeight: "700" }}>
                Patients can add you from their app using your Doctor ID.
              </Text>
            </View>
          ) : (
            items.map((it, idx) => (
              <View key={`${it.patientId}_${idx}`} style={[styles.row, idx !== items.length - 1 && styles.rowDivider]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{it.patient?.name ?? "Patient"}</Text>
                  <Text style={styles.sub}>{it.patient?.email ?? it.patientId}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: "#22c55e" }]}
                  onPress={() => accept(it.patientId)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnText}>Accept</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: "#ef4444" }]}
                  onPress={() => reject(it.patientId)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            ))
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
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },
  main: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  cardTitle: { fontSize: 14, fontWeight: "900", color: "#111827" },
  muted: { marginTop: 6, color: "#64748b", fontWeight: "700", fontSize: 12, lineHeight: 16 },

  listCard: { backgroundColor: "#ffffff", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#e2e8f0" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  name: { fontSize: 14, fontWeight: "900", color: "#111827" },
  sub: { marginTop: 2, fontSize: 12, fontWeight: "700", color: "#64748b" },

  btn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  btnText: { color: "#fff", fontWeight: "900", fontSize: 12 },
});
