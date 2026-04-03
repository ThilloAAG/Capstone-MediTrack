// frontend/app/patient/prescriptions/[id].tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Ionicons from "@expo/vector-icons/Ionicons";
import { auth, db } from "../../../src/firebase";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";

type FrequencyType = "DAILY" | "WEEKLY";
type StatusType = "active" | "suspended" | "completed";

type Prescription = {
  id: string;
  medicationName?: string;
  dosage?: string;
  notes?: string | null;

  frequencyType?: FrequencyType | string;
  daysOfWeek?: string[];
  timesPerDay?: number | null;
  times?: string[];

  // legacy
  frequency?: string;
  time?: string;

  startDate?: string | null;
  endDate?: string | null;
  startDateTs?: Timestamp;
  endDateTs?: Timestamp;

  status?: StatusType | string;
};

function scheduleLabel(p: Prescription) {
  const ft = String(p.frequencyType ?? "").toUpperCase();
  if (ft === "WEEKLY") {
    const days = Array.isArray(p.daysOfWeek) ? p.daysOfWeek : [];
    return days.length ? `Weekly (${days.join(", ")})` : "Weekly";
  }
  if (ft === "DAILY") {
    const tpd =
      typeof p.timesPerDay === "number"
        ? p.timesPerDay
        : Array.isArray(p.times)
          ? p.times.length
          : 1;
    return `Daily (${tpd}x/day)`;
  }
  if (p.frequency) return String(p.frequency);
  return "—";
}

function timesLabel(p: Prescription) {
  const t = Array.isArray(p.times) ? p.times.filter(Boolean) : [];
  if (t.length) return t.join(", ");
  if (p.time) return String(p.time);
  return "—";
}

export default function PrescriptionDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();

  const docId = useMemo(() => {
    const v = params.id;
    if (!v) return "";
    return Array.isArray(v) ? v[0] : v;
  }, [params.id]);

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !docId) {
      setLoading(false);
      return;
    }

    const ref = doc(db, "prescriptions", uid, "userPrescriptions", docId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setPrescription(null);
          setLoading(false);
          return;
        }
        const data = { id: snap.id, ...(snap.data() as any) } as Prescription;
        setPrescription(data);
        setLoading(false);
      },
      () => {
        setPrescription(null);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [docId]);

  const handleBack = () => router.back();

  const handleNavigateToTab = (tab: string) => {
    switch (tab) {
      case "dashboard":
        router.push("/patient/dashboard");
        break;
      case "prescriptions":
        router.push("/patient/prescriptions");
        break;
      case "machines":
        router.push("/patient/machines");
        break;
      case "notifications":
        router.push("/patient/notifications");
        break;
      case "profile":
        router.push("/patient/profile");
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.wrapper}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={28} color="#0A84FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prescription Details</Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          {loading ? (
            <Text style={styles.loadingText}>Loading…</Text>
          ) : !prescription ? (
            <Text style={styles.errorText}>Prescription not found.</Text>
          ) : (
            <>
              {/* Medication header */}
              <View style={styles.medicationHeader}>
                <View style={styles.medicationImageContainer}>
                  <Image
                    source={{ uri: "https://dummyimage.com/96x96/f3f4f6/aaaaaa.png&text=Rx" }}
                    style={styles.medicationImage}
                    resizeMode="cover"
                  />
                </View>

                <View style={styles.medicationInfo}>
                  <Text style={styles.medicationName}>{prescription.medicationName || "Unnamed"}</Text>
                  <Text style={styles.medicationDosage}>{prescription.dosage || "—"}</Text>
                  <Text style={styles.readOnlyNote}>Read-only (managed by your doctor)</Text>
                </View>
              </View>

              {/* Details */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Frequency</Text>
                  <Text style={styles.detailValue}>{scheduleLabel(prescription)}</Text>
                </View>

                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Times of intake</Text>
                  <Text style={styles.detailValue}>{timesLabel(prescription)}</Text>
                </View>

                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Period</Text>
                  <Text style={styles.detailValue}>
                    {prescription.startDate ? `Start ${prescription.startDate}` : "Start —"}
                    {prescription.endDate ? `\nEnd ${prescription.endDate}` : ""}
                  </Text>
                </View>

                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={styles.detailValue}>{String(prescription.status ?? "active").toUpperCase()}</Text>
                </View>
              </View>

              {!!prescription.notes && (
                <View style={styles.notesCard}>
                  <Text style={styles.notesLabel}>Notes</Text>
                  <Text style={styles.notesValue}>{prescription.notes}</Text>
                </View>
              )}
            </>
          )}

          <View style={{ height: 90 }} />
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity style={styles.navItem} onPress={() => handleNavigateToTab("dashboard")} activeOpacity={0.8}>
            <Ionicons name="grid-outline" size={24} color="#64748b" />
            <Text style={styles.navText}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => handleNavigateToTab("prescriptions")} activeOpacity={0.8}>
            <Ionicons name="medical" size={24} color="#13a4ec" />
            <Text style={[styles.navText, styles.navTextActive]}>Prescriptions</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => handleNavigateToTab("machines")} activeOpacity={0.8}>
            <Ionicons name="hardware-chip-outline" size={24} color="#64748b" />
            <Text style={styles.navText}>Machines</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => handleNavigateToTab("notifications")} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={24} color="#64748b" />
            <Text style={styles.navText}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => handleNavigateToTab("profile")} activeOpacity={0.8}>
            <Ionicons name="person-outline" size={24} color="#64748b" />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
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
    paddingVertical: 16,
    backgroundColor: "#f6f7f8cc",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1f2937", flex: 1, textAlign: "center", paddingRight: 32 },
  spacer: { width: 32 },

  main: { flex: 1, paddingHorizontal: 16, paddingTop: 24 },

  loadingText: { color: "#6b7280", textAlign: "center", padding: 20 },
  errorText: { color: "#ef4444", textAlign: "center", padding: 20 },

  medicationHeader: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24 },
  medicationImageContainer: { width: 64, height: 64, borderRadius: 24, overflow: "hidden" },
  medicationImage: { width: 100, height: 100 },
  medicationInfo: { flex: 1 },
  medicationName: { fontSize: 24, fontWeight: "700", color: "#1f2937", marginBottom: 4 },
  medicationDosage: { fontSize: 16, color: "#64748b" },
  readOnlyNote: { marginTop: 6, fontSize: 12, fontWeight: "700", color: "#13a4ec" },

  detailsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 24 },
  detailCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 24,
    width: "47%",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  detailLabel: { fontSize: 14, fontWeight: "500", color: "#64748b", marginBottom: 4 },
  detailValue: { fontSize: 16, fontWeight: "600", color: "#1f2937" },

  notesCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  notesLabel: { fontSize: 14, fontWeight: "500", color: "#64748b", marginBottom: 4 },
  notesValue: { fontSize: 16, color: "#374151", lineHeight: 22 },

  bottomNavigation: {
    flexDirection: "row",
    backgroundColor: "#ffffffcc",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    paddingBottom: 8,
  },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8 },
  navText: { fontSize: 12, fontWeight: "500", color: "#64748b" },
  navTextActive: { color: "#13a4ec", fontWeight: "600" },
});
