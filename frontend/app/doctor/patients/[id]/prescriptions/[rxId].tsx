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
import { doc, getDoc, updateDoc, serverTimestamp, deleteDoc, Timestamp } from "firebase/firestore";

import {
  computeRxStatus,
  parseDateStart,
  parseDateEnd,
  isValidYYYYMMDD,
  formatYYYYMMDD,
} from "../../../../../services/prescriptionStatus";

type StatusType = "active" | "suspended" | "completed";
type StatusMode = "auto" | "manual";

type Prescription = {
  id: string;
  medicationName?: string;
  dosage?: string;
  notes?: string | null;

  startDate?: string | null;
  endDate?: string | null;
  startDateTs?: Timestamp;
  endDateTs?: Timestamp;

  status?: StatusType | string;
  statusMode?: StatusMode | string;

  doctorId?: string;
};

export default function DoctorPrescriptionDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[]; rxId?: string | string[] }>();

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

  // editable fields (keep whatever you had)
  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("");
  const [notes, setNotes] = useState("");

  // dates (needed for auto)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // status controls
  const [statusMode, setStatusMode] = useState<StatusMode>("auto");
  const [status, setStatus] = useState<StatusType>("active");

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

        const ref = doc(db, "prescriptions", patientId, "userPrescriptions", rxId);
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

        const sdStr =
          (data.startDate as string) ||
          (data.startDateTs?.toDate ? formatYYYYMMDD(data.startDateTs.toDate()) : "");
        const edStr =
          (data.endDate as string) ||
          (data.endDateTs?.toDate ? formatYYYYMMDD(data.endDateTs.toDate()) : "");

        setStartDate(sdStr ?? "");
        setEndDate(edStr ?? "");

        const mode = (data.statusMode as StatusMode) ?? "auto";
        const st = (data.status as StatusType) ?? "active";
        setStatusMode(mode === "manual" ? "manual" : "auto");
        setStatus(st === "suspended" || st === "completed" ? st : "active");
      } catch (e) {
        console.log("❌ Load prescription detail error:", e);
        setPrescription(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [patientId, rxId]);

  const computeAutoStatusNow = () => {
    const sd = parseDateStart(startDate.trim());
    const ed = parseDateEnd(endDate.trim());
    if (!sd || !ed) return null;
    return computeRxStatus(sd, ed, new Date()) as StatusType;
  };

  const validate = () => {
    if (!medName.trim()) {
      Alert.alert("Error", "Medication name is required.");
      return false;
    }
    if (!dosage.trim()) {
      Alert.alert("Error", "Dosage is required.");
      return false;
    }
    if (!startDate.trim() || !isValidYYYYMMDD(startDate.trim())) {
      Alert.alert("Error", "Start date is required (YYYY-MM-DD).");
      return false;
    }
    if (!endDate.trim() || !isValidYYYYMMDD(endDate.trim())) {
      Alert.alert("Error", "End date is required (YYYY-MM-DD).");
      return false;
    }
    const sd = parseDateStart(startDate.trim());
    const ed = parseDateEnd(endDate.trim());
    if (!sd || !ed) {
      Alert.alert("Error", "Invalid date format. Use YYYY-MM-DD.");
      return false;
    }
    if (ed.getTime() < sd.getTime()) {
      Alert.alert("Error", "End date must be after start date.");
      return false;
    }
    return true;
  };

  const onSave = async () => {
    if (!patientId || !rxId) return;
    if (!validate()) return;

    try {
      setSaving(true);

      const ref = doc(db, "prescriptions", patientId, "userPrescriptions", rxId);

      const sd = parseDateStart(startDate.trim())!;
      const ed = parseDateEnd(endDate.trim())!;

      // If mode is auto, status follows date-range.
      // If mode is manual, keep whatever manual status already is.
      const nextStatus: StatusType =
        statusMode === "auto" ? (computeRxStatus(sd, ed, new Date()) as StatusType) : status;

      const payload: any = {
        medicationName: medName.trim(),
        dosage: dosage.trim(),
        notes: notes.trim() || null,

        startDate: startDate.trim(),
        endDate: endDate.trim(),
        startDateTs: Timestamp.fromDate(sd),
        endDateTs: Timestamp.fromDate(ed),

        statusMode,
        status: nextStatus,

        updatedAt: serverTimestamp(),
        ...(statusMode === "auto" ? { statusUpdatedAt: serverTimestamp() } : {}),
      };

      await updateDoc(ref, payload);

      setStatus(nextStatus);
      Alert.alert("Saved", "Prescription updated ✅");
    } catch (e: any) {
      console.log("Update prescription error:", e);
      Alert.alert("Error", e?.message || "Failed to update prescription.");
    } finally {
      setSaving(false);
    }
  };

  const updateManualStatus = async (next: StatusType) => {
    if (!patientId || !rxId) return;

    try {
      setSaving(true);
      const ref = doc(db, "prescriptions", patientId, "userPrescriptions", rxId);

      await updateDoc(ref, {
        status: next,
        statusMode: "manual",
        statusUpdatedAt: serverTimestamp(),
        statusManualUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setStatus(next);
      setStatusMode("manual");
      Alert.alert("Updated", `Status set to ${next.toUpperCase()} ✅`);
    } catch (e: any) {
      console.log("Manual status update error:", e);
      Alert.alert("Error", e?.message || "Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  const resumeAutoStatus = async () => {
    if (!patientId || !rxId) return;

    const next = computeAutoStatusNow();
    if (!next) {
      Alert.alert("Error", "Start/End date required to resume auto status.");
      return;
    }

    try {
      setSaving(true);
      const ref = doc(db, "prescriptions", patientId, "userPrescriptions", rxId);

      await updateDoc(ref, {
        status: next,
        statusMode: "auto",
        statusUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setStatus(next);
      setStatusMode("auto");
      Alert.alert("Auto resumed", `Status is now ${String(next).toUpperCase()} ✅`);
    } catch (e: any) {
      console.log("Resume auto status error:", e);
      Alert.alert("Error", e?.message || "Failed to resume auto status.");
    } finally {
      setSaving(false);
    }
  };

  const onRenew30Days = async () => {
    const today = new Date();
    const newStart = formatYYYYMMDD(today);

    const endDt = new Date(today);
    endDt.setDate(endDt.getDate() + 30);
    const newEnd = formatYYYYMMDD(endDt);

    Alert.alert("Renew prescription", `Renew for 30 days?\nStart: ${newStart}\nEnd: ${newEnd}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Renew",
        onPress: async () => {
          setStartDate(newStart);
          setEndDate(newEnd);
          setStatusMode("auto"); // renew goes back to auto by default
          setTimeout(() => onSave(), 0);
        },
      },
    ]);
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
            const ref = doc(db, "prescriptions", patientId, "userPrescriptions", rxId);
            await deleteDoc(ref);
            Alert.alert("Deleted", "Prescription deleted.");
            router.back();
          } catch (e: any) {
            console.log("Delete prescription error:", e);
            Alert.alert("Error", e?.message || "Failed to delete prescription.");
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.85}>
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prescription</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.empty}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.emptyTitle}>Prescription not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const autoNow = computeAutoStatusNow();
  const currentStatus = status; // what is saved in Firestore (auto or manual)
  const showRenew = currentStatus === "completed";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{prescription.medicationName || "Prescription"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status</Text>

          <Text style={styles.statusValue}>{currentStatus.toUpperCase()}</Text>
          <Text style={styles.statusHint}>Mode: {statusMode.toUpperCase()}</Text>

          {statusMode === "manual" && (
            <Text style={[styles.statusHint, { marginTop: 6 }]}>
              Auto (based on dates) would be: {autoNow ? autoNow.toUpperCase() : "—"}
            </Text>
          )}

          <View style={{ marginTop: 12, gap: 10 }}>
            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
              <TouchableOpacity
                style={styles.statusBtn}
                onPress={() => updateManualStatus("active")}
                activeOpacity={0.85}
                disabled={saving}
              >
                <Text style={styles.statusBtnText}>Set ACTIVE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statusBtn}
                onPress={() => updateManualStatus("suspended")}
                activeOpacity={0.85}
                disabled={saving}
              >
                <Text style={styles.statusBtnText}>Set SUSPENDED</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statusBtn}
                onPress={() => updateManualStatus("completed")}
                activeOpacity={0.85}
                disabled={saving}
              >
                <Text style={styles.statusBtnText}>Set COMPLETED</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.resumeAutoBtn}
              onPress={resumeAutoStatus}
              activeOpacity={0.85}
              disabled={saving}
            >
              <Text style={styles.resumeAutoText}>Resume AUTO</Text>
            </TouchableOpacity>
          </View>

          {showRenew && (
            <TouchableOpacity style={styles.renewBtn} onPress={onRenew30Days} activeOpacity={0.85}>
              <Ionicons name="refresh-outline" size={18} color="#111827" />
              <Text style={styles.renewText}>Renew (30 days)</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Medication</Text>

          <Text style={styles.label}>Medication name</Text>
          <TextInput style={styles.input} value={medName} onChangeText={setMedName} placeholder="Medication name" />

          <Text style={[styles.label, { marginTop: 12 }]}>Dosage</Text>
          <TextInput style={styles.input} value={dosage} onChangeText={setDosage} placeholder="e.g. 500 mg, 1 pill" />

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
          <Text style={styles.cardTitle}>Dates</Text>

          <Text style={styles.label}>Start date (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />

          <Text style={[styles.label, { marginTop: 12 }]}>End date (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />
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

        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} activeOpacity={0.85}>
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
          <Text style={styles.deleteText}>Delete prescription</Text>
        </TouchableOpacity>

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
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
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

  statusValue: { fontSize: 14, fontWeight: "900", color: "#111827" },
  statusHint: { marginTop: 6, fontSize: 11, fontWeight: "700", color: "#94a3b8", lineHeight: 16 },

  statusBtn: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statusBtnText: { fontWeight: "900", color: "#111827", fontSize: 12 },

  resumeAutoBtn: {
    backgroundColor: "#13a4ec",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  resumeAutoText: { color: "#fff", fontWeight: "900" },

  renewBtn: {
    marginTop: 12,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  renewText: { color: "#111827", fontWeight: "900" },

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
