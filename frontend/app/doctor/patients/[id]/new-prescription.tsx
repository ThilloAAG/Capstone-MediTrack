import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { auth, db } from "../../../../src/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

type Frequency = "once" | "daily" | "weekly";

export default function NewPrescriptionScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();

  const patientId = useMemo(() => {
    if (!params.id) return "";
    return Array.isArray(params.id) ? params.id[0] : params.id;
  }, [params.id]);

  // ----- Form state -----
  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState(""); // ex: "10 mg" or "1 pill"
  const [notes, setNotes] = useState("");

  // Basic schedule (simple version)
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [timesPerDay, setTimesPerDay] = useState("1"); // for daily
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD optional
  const [endDate, setEndDate] = useState(""); // YYYY-MM-DD optional

  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!patientId) {
      Alert.alert("Error", "Missing patient id in route.");
      return false;
    }
    if (!medName.trim()) {
      Alert.alert("Error", "Medication name is required.");
      return false;
    }
    if (!dosage.trim()) {
      Alert.alert("Error", "Dosage is required.");
      return false;
    }
    if (frequency === "daily") {
      const n = Number(timesPerDay);
      if (!Number.isFinite(n) || n < 1 || n > 10) {
        Alert.alert("Error", "Times per day must be a number between 1 and 10.");
        return false;
      }
    }
    return true;
  };

  const onSave = async () => {
    if (!validate()) return;

    const doctorUid = auth.currentUser?.uid;
    if (!doctorUid) {
      router.replace("/auth/login");
      return;
    }

    try {
      setLoading(true);

      // ✅ optional but recommended: verify doctor is linked to patient
      // prevents confusing permission errors if link is missing
      const linkSnap = await getDoc(doc(db, "doctors", doctorUid, "patients", patientId));
      if (!linkSnap.exists()) {
        Alert.alert(
          "Not linked",
          "This patient is not linked to your doctor account yet. Please add/link the patient first."
        );
        return;
      }

      // ✅ Save prescription
      const rxRef = collection(db, "prescriptions", patientId, "userPrescriptions");

      const payload = {
        // identity
        doctorId: doctorUid,
        patientId,

        // medication
        medicationName: medName.trim(),
        dosage: dosage.trim(),
        notes: notes.trim() || null,

        // schedule (simple v1)
        frequency,
        timesPerDay: frequency === "daily" ? Number(timesPerDay) : null,
        startDate: startDate.trim() || null,
        endDate: endDate.trim() || null,

        // status
        status: "active",

        // timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const created = await addDoc(rxRef, payload);

      Alert.alert("Success", `Prescription created ✅\nID: ${created.id}`);

      // back to patient detail page
      router.back();
    } catch (e: any) {
      console.log("Create prescription error:", e);
      Alert.alert("Error", e?.message || "Failed to create prescription.");
    } finally {
      setLoading(false);
    }
  };

  const Chip = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.wrapper}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>New Prescription</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
            {/* Patient context */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Patient</Text>
              <Text style={styles.muted}>Patient ID</Text>
              <Text style={styles.value}>{patientId || "Missing id"}</Text>
            </View>

            {/* Medication */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Medication</Text>

              <Text style={styles.label}>Medication name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Metformin"
                value={medName}
                onChangeText={setMedName}
              />

              <Text style={[styles.label, { marginTop: 12 }]}>Dosage</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 500 mg, 1 pill"
                value={dosage}
                onChangeText={setDosage}
              />

              <Text style={[styles.label, { marginTop: 12 }]}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, { height: 90, textAlignVertical: "top" }]}
                placeholder="ex: take with food"
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>

            {/* Schedule */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Schedule</Text>

              <Text style={styles.label}>Frequency</Text>
              <View style={styles.chipsRow}>
                <Chip label="Once" active={frequency === "once"} onPress={() => setFrequency("once")} />
                <Chip label="Daily" active={frequency === "daily"} onPress={() => setFrequency("daily")} />
                <Chip label="Weekly" active={frequency === "weekly"} onPress={() => setFrequency("weekly")} />
              </View>

              {frequency === "daily" && (
                <>
                  <Text style={[styles.label, { marginTop: 12 }]}>Times per day</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    value={timesPerDay}
                    onChangeText={setTimesPerDay}
                    keyboardType="number-pad"
                  />
                </>
              )}

              <Text style={[styles.label, { marginTop: 12 }]}>Start date (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={startDate}
                onChangeText={setStartDate}
                autoCapitalize="none"
              />

              <Text style={[styles.label, { marginTop: 12 }]}>End date (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={endDate}
                onChangeText={setEndDate}
                autoCapitalize="none"
              />
            </View>

            {/* Save */}
            <TouchableOpacity
              style={[styles.saveBtn, loading && { opacity: 0.75 }]}
              onPress={onSave}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color="#fff" />
                  <Text style={styles.saveText}>Create prescription</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },

  main: { flex: 1, padding: 16 },

  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 14, fontWeight: "900", color: "#111827", marginBottom: 10 },

  label: { fontSize: 12, fontWeight: "800", color: "#475569", marginBottom: 8 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    color: "#111827",
  },

  muted: { fontSize: 12, fontWeight: "800", color: "#64748b" },
  value: { marginTop: 6, fontSize: 14, fontWeight: "900", color: "#111827" },

  chipsRow: { flexDirection: "row", gap: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
  },
  chipActive: {
    backgroundColor: "#13a4ec",
    borderColor: "#13a4ec",
  },
  chipText: { fontWeight: "900", color: "#0f172a", fontSize: 12 },
  chipTextActive: { color: "#fff" },

  saveBtn: {
    marginTop: 4,
    backgroundColor: "#13a4ec",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  saveText: { color: "#fff", fontWeight: "900" },
});
