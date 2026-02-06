import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { auth, db } from "../../../../../src/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
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
};

export default function DoctorPrescriptionDetailScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    rxId?: string | string[];
  }>();

  const patientId = useMemo(() => {
    if (!params.id) return "";
    return Array.isArray(params.id) ? params.id[0] : params.id;
  }, [params.id]);

  const rxId = useMemo(() => {
    if (!params.rxId) return "";
    return Array.isArray(params.rxId) ? params.rxId[0] : params.rxId;
  }, [params.rxId]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prescription, setPrescription] = useState<Prescription | null>(null);

  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("");
  const [notes, setNotes] = useState("");
  const [frequency, setFrequency] = useState<"once" | "daily" | "weekly">(
    "daily"
  );
  const [timesPerDay, setTimesPerDay] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<"active" | "paused" | "completed">(
    "active"
  );

  useEffect(() => {
    const run = async () => {
      try {
        const doctorUid = auth.currentUser?.uid;
        if (!doctorUid) {
          router.replace("/auth/login");
          return;
        }
        if (!patientId || !rxId) {
          setPrescription(null);
          setLoading(false);
          return;
        }

        const ref = doc(
          db,
          "prescriptions",
          patientId,
          "userPrescriptions",
          rxId
        );
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setPrescription(null);
          setLoading(false);
          return;
        }

        const data = snap.data() as any;
        const rx: Prescription = { id: snap.id, ...data };
        setPrescription(rx);

        setMedName(data.medicationName ?? "");
        setDosage(data.dosage ?? "");
        setNotes(data.notes ?? "");
        setFrequency((data.frequency as any) ?? "daily");
        setTimesPerDay(
          data.timesPerDay != null && !isNaN(data.timesPerDay)
            ? String(data.timesPerDay)
            : "1"
        );
        setStartDate(data.startDate ?? "");
        setEndDate(data.endDate ?? "");
        setStatus((data.status as any) ?? "active");
      } catch (e) {
        console.log("❌ Load prescription detail error:", e);
        setPrescription(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [patientId, rxId]);

  const validate = () => {
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
        Alert.alert("Error", "Times per day must be between 1 and 10.");
        return false;
      }
    }
    return true;
  };

  const onSave = async () => {
    if (!patientId || !rxId) return;
    if (!validate()) return;

    try {
      setSaving(true);
      const ref = doc(
        db,
        "prescriptions",
        patientId,
        "userPrescriptions",
        rxId
      );

      const payload: any = {
        medicationName: medName.trim(),
        dosage: dosage.trim(),
        notes: notes.trim() || null,
        frequency,
        timesPerDay: frequency === "daily" ? Number(timesPerDay) : null,
        startDate: startDate.trim() || null,
        endDate: endDate.trim() || null,
        status,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(ref, payload);
      Alert.alert("Saved", "Prescription updated ✅");
    } catch (e: any) {
      console.log("Update prescription error:", e);
      Alert.alert("Error", e?.message || "Failed to update prescription.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!patientId || !rxId) return;

    Alert.alert("Delete prescription", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const ref = doc(
              db,
              "prescriptions",
              patientId,
              "userPrescriptions",
              rxId
            );
            await deleteDoc(ref);
            Alert.alert("Deleted", "Prescription deleted.");
            router.back();
          } catch (e: any) {
            console.log("Delete prescription error:", e);
            Alert.alert(
              "Error",
              e?.message || "Failed to delete prescription."
            );
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prescription</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ paddingTop: 40 }}>
          <ActivityIndicator size="large" color="#13a4ec" />
        </View>
      </SafeAreaView>
    );
  }

  if (!prescription) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prescription</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.empty}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color="#ef4444"
          />
          <Text style={styles.emptyTitle}>Prescription not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {prescription.medicationName || "Prescription"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Medication</Text>

          <Text style={styles.label}>Medication name</Text>
          <TextInput
            style={styles.input}
            value={medName}
            onChangeText={setMedName}
            placeholder="Medication name"
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Dosage</Text>
          <TextInput
            style={styles.input}
            value={dosage}
            onChangeText={setDosage}
            placeholder="e.g. 500 mg, 1 pill"
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Notes</Text>
          <TextInput
            style={[styles.input, { height: 90, textAlignVertical: "top" }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes"
            multiline
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Schedule</Text>

          <Text style={styles.label}>Frequency</Text>
          <View style={styles.chipsRow}>
            <Chip
              label="Once"
              active={frequency === "once"}
              onPress={() => setFrequency("once")}
            />
            <Chip
              label="Daily"
              active={frequency === "daily"}
              onPress={() => setFrequency("daily")}
            />
            <Chip
              label="Weekly"
              active={frequency === "weekly"}
              onPress={() => setFrequency("weekly")}
            />
          </View>

          {frequency === "daily" && (
            <>
              <Text style={[styles.label, { marginTop: 12 }]}>
                Times per day
              </Text>
              <TextInput
                style={styles.input}
                value={timesPerDay}
                onChangeText={setTimesPerDay}
                keyboardType="number-pad"
              />
            </>
          )}

          <Text style={[styles.label, { marginTop: 12 }]}>Start date</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
          />

          <Text style={[styles.label, { marginTop: 12 }]}>End date</Text>
          <TextInput
            style={styles.input}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status</Text>
          <View style={styles.chipsRow}>
            <Chip
              label="Active"
              active={status === "active"}
              onPress={() => setStatus("active")}
            />
            <Chip
              label="Paused"
              active={status === "paused"}
              onPress={() => setStatus("paused")}
            />
            <Chip
              label="Completed"
              active={status === "completed"}
              onPress={() => setStatus("completed")}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.75 }]}
          onPress={onSave}
          activeOpacity={0.85}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={styles.saveText}>Save changes</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={onDelete}
          activeOpacity={0.85}
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
          <Text style={styles.deleteText}>Delete prescription</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
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
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 10,
  },
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
  chipsRow: { flexDirection: "row", gap: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: "#13a4ec", borderColor: "#13a4ec" },
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
  deleteBtn: {
    marginTop: 10,
    backgroundColor: "#fee2e2",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  deleteText: { color: "#ef4444", fontWeight: "900" },
  empty: { paddingTop: 60, alignItems: "center" },
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: "900" },
});
