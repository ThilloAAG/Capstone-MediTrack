import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { auth, db } from "../../../../src/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

import {
  computeRxStatus,
  parseDateStart,
  parseDateEnd,
  isValidYYYYMMDD,
} from "../../../../services/prescriptionStatus";

type FrequencyType = "DAILY" | "WEEKLY";
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

async function ensureActiveLink(doctorId: string, patientId: string) {
  const linkId = `${patientId}_${doctorId}`; // ✅ underscore-only
  const linkSnap = await getDoc(doc(db, "doctorPatientLinks", linkId));
  if (!linkSnap.exists()) return false;
  const data = linkSnap.data() as any;
  return data?.status === "active";
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatYYYYMMDDLocal(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatHHMM(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function normalizeToHHMM(value: string) {
  const v = String(value ?? "").trim();
  if (!v) return "";

  const m1 = v.match(/^(\d{1,2}):(\d{2})$/);
  if (m1) {
    const hh = Math.max(0, Math.min(23, Number(m1[1])));
    const mm = Math.max(0, Math.min(59, Number(m1[2])));
    return `${pad2(hh)}:${pad2(mm)}`;
  }

  const m2 = v.match(/^(\d{2})(\d{2})$/);
  if (m2) {
    const hh = Math.max(0, Math.min(23, Number(m2[1])));
    const mm = Math.max(0, Math.min(59, Number(m2[2])));
    return `${pad2(hh)}:${pad2(mm)}`;
  }

  return "";
}

function parseHHMMToDate(value: string) {
  const base = new Date();
  const norm = normalizeToHHMM(value);
  if (!norm) return base;
  const [hStr, mStr] = norm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return base;
  base.setHours(h, m, 0, 0);
  return base;
}

export default function NewPrescriptionScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();

  const patientId = useMemo(() => {
    if (!params.id) return "";
    return Array.isArray(params.id) ? params.id[0] : params.id;
  }, [params.id]);

  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("");
  const [notes, setNotes] = useState("");

  const [patientName, setPatientName] = useState("");
  const [loadingPatient, setLoadingPatient] = useState(true);

  const [frequencyType, setFrequencyType] = useState<FrequencyType>("DAILY");

  // 1..6
  const [timesPerDay, setTimesPerDay] = useState<number>(1);
  const [times, setTimes] = useState<string[]>([""]);

  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);

  const [startDate, setStartDate] = useState<string>("YYYY-MM-DD");
  const [endDate, setEndDate] = useState<string>("YYYY-MM-DD");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateField, setActiveDateField] = useState<"start" | "end">("start");

  const [showTimePickerIndex, setShowTimePickerIndex] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);

  // Load patient name
  useEffect(() => {
    let mounted = true;

    const loadPatient = async () => {
      if (!patientId) {
        if (mounted) {
          setPatientName("Unknown patient");
          setLoadingPatient(false);
        }
        return;
      }

      try {
        setLoadingPatient(true);
        const snap = await getDoc(doc(db, "users", patientId));
        if (!mounted) return;

        if (snap.exists()) {
          const data = snap.data() as any;
          const name = String(data?.name ?? data?.fullName ?? "").trim();
          setPatientName(name || "Unknown patient");
        } else {
          setPatientName("Unknown patient");
        }
      } catch (e) {
        console.log("Load patient error", e);
        if (mounted) setPatientName("Unknown patient");
      } finally {
        if (mounted) setLoadingPatient(false);
      }
    };

    loadPatient();
    return () => {
      mounted = false;
    };
  }, [patientId]);

  // Ensure times array length always == timesPerDay
  useEffect(() => {
    const count = Math.max(1, Math.min(6, Number(timesPerDay) || 1));
    setTimes((prev) => {
      const next = [...prev];
      while (next.length < count) next.push("");
      return next.slice(0, count);
    });
  }, [timesPerDay]);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setShowDatePicker(false);
      return;
    }
    if (!selectedDate) return;

    const next = formatYYYYMMDDLocal(selectedDate);
    if (activeDateField === "start") setStartDate(next);
    else setEndDate(next);

    setShowDatePicker(Platform.OS === "ios");
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setShowTimePickerIndex(null);
      return;
    }
    if (!selectedDate) return;
    if (showTimePickerIndex === null) return;

    const next = formatHHMM(selectedDate); // "HH:mm"
    // Replace the exact slot in the array (old value overwritten)
    setTimes((prev) => prev.map((t, i) => (i === showTimePickerIndex ? next : t)));
    setShowTimePickerIndex(Platform.OS === "ios" ? showTimePickerIndex : null);
  };

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

    const count = Math.max(1, Math.min(6, Number(timesPerDay) || 1));
    if (frequencyType === "WEEKLY" && daysOfWeek.length === 0) {
      Alert.alert("Error", "Please select at least one day of the week.");
      return false;
    }

    const normalized = times.slice(0, count).map(normalizeToHHMM);
    if (normalized.length !== count || normalized.some((t) => !t)) {
      Alert.alert("Error", "Please fill all time fields.");
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
    if (ed.getTime() <= sd.getTime()) {
      Alert.alert("Error", "End date must be after start date.");
      return false;
    }

    return true;
  };

  const computedStatusPreview = useMemo(() => {
    const sd = parseDateStart(startDate.trim());
    const ed = parseDateEnd(endDate.trim());
    if (!sd || !ed) return "";
    return computeRxStatus(sd, ed, new Date()).toUpperCase();
  }, [startDate, endDate]);

  const onSave = async () => {
    if (!validate()) return;

    const doctorUid = auth.currentUser?.uid;
    if (!doctorUid) {
      router.replace("/auth/login");
      return;
    }

    try {
      setLoading(true);

      const ok = await ensureActiveLink(doctorUid, patientId);
      if (!ok) {
        Alert.alert("Not authorized", "You are not linked to this patient (active link required).");
        return;
      }

      const sd = parseDateStart(startDate.trim())!;
      const ed = parseDateEnd(endDate.trim())!;
      const status = computeRxStatus(sd, ed, new Date());

      const count = Math.max(1, Math.min(6, Number(timesPerDay) || 1));
      const normalizedTimes = times.slice(0, count).map(normalizeToHHMM);

      const rxRef = collection(db, "prescriptions", patientId, "userPrescriptions");

      const payload: any = {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),

        doctorId: doctorUid,
        medicationName: medName.trim(),
        dosage: dosage.trim(),
        notes: notes.trim() || null,

        frequencyType,
        timesPerDay: count,
        // Store intake times in array at fixed positions: [t1, t2, t3, ...]
        times: normalizedTimes,

        ...(frequencyType === "WEEKLY" ? { daysOfWeek } : {}),

        startDate: startDate.trim(),
        endDate: endDate.trim(),
        startDateTs: Timestamp.fromDate(sd),
        endDateTs: Timestamp.fromDate(ed),

        status,
        statusMode: "auto",
        statusUpdatedAt: serverTimestamp(),
        missedCount: 0,
        riskLevel: "NORMAL"
      };

      const created = await addDoc(rxRef, payload);

      Alert.alert("Success", `Prescription created (${created.id})`);
      router.back();
    } catch (e: any) {
      console.log("Create prescription error", e);
      Alert.alert("Error", e?.message ?? "Failed to create prescription.");
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
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        setShowDatePicker(false);
        setShowTimePickerIndex(null);
      }}
      accessible={false}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <View style={styles.wrapper}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.85}>
              <Ionicons name="chevron-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Prescription</Text>
            <View style={{ width: 40 }} />
          </View>

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Patient</Text>
                <Text style={styles.value}>{loadingPatient ? "Loading..." : patientName}</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Medication</Text>

                <Text style={styles.label}>Medication name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Metformin"
                  placeholderTextColor="#6b7280"
                  value={medName}
                  onChangeText={setMedName}
                />

                <Text style={[styles.label, { marginTop: 12 }]}>Dosage</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 1 pill"
                  placeholderTextColor="#6b7280"
                  value={dosage}
                  onChangeText={setDosage}
                />

                <Text style={[styles.label, { marginTop: 12 }]}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, { height: 90, textAlignVertical: "top" }]}
                  placeholder="e.g. take with food"
                  placeholderTextColor="#6b7280"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Schedule</Text>

                <Text style={styles.label}>Frequency type</Text>
                <View style={styles.chipsRow}>
                  <Chip label="Daily" active={frequencyType === "DAILY"} onPress={() => setFrequencyType("DAILY")} />
                  <Chip label="Weekly" active={frequencyType === "WEEKLY"} onPress={() => setFrequencyType("WEEKLY")} />
                </View>

                {frequencyType === "WEEKLY" && (
                  <>
                    <Text style={[styles.label, { marginTop: 12 }]}>Days of week</Text>
                    <View style={[styles.chipsRow, { flexWrap: "wrap" }]}>
                      {WEEKDAYS.map((day) => {
                        const active = daysOfWeek.includes(day);
                        return (
                          <Chip
                            key={day}
                            label={day}
                            active={active}
                            onPress={() =>
                              setDaysOfWeek((prev) => (active ? prev.filter((d) => d !== day) : [...prev, day]))
                            }
                          />
                        );
                      })}
                    </View>
                  </>
                )}

                <Text style={[styles.label, { marginTop: 12 }]}>Times per day (1–6)</Text>
                <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <Chip key={n} label={`${n}`} active={timesPerDay === n} onPress={() => setTimesPerDay(n)} />
                  ))}
                </View>

                {times.map((t, index) => (
                  <View key={`time-${index}`} style={{ marginTop: 12 }}>
                    <Text style={styles.label}>{`Time of intake ${index + 1}`}</Text>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.input}
                      onPress={() => {
                        setShowDatePicker(false);
                        setShowTimePickerIndex(index);
                      }}
                    >
                      <Text style={{ color: t ? "#111827" : "#6b7280", fontWeight: "700" }}>
                        {normalizeToHHMM(t) || "Select time"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Dates</Text>

                <Text style={styles.label}>Start date (YYYY-MM-DD)</Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.input}
                  onPress={() => {
                    setShowTimePickerIndex(null);
                    setActiveDateField("start");
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={{ color: startDate ? "#111827" : "#6b7280", fontWeight: "700" }}>
                    {startDate || "Select date"}
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.label, { marginTop: 12 }]}>End date (YYYY-MM-DD)</Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.input}
                  onPress={() => {
                    setShowTimePickerIndex(null);
                    setActiveDateField("end");
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={{ color: endDate ? "#111827" : "#6b7280", fontWeight: "700" }}>
                    {endDate || "Select date"}
                  </Text>
                </TouchableOpacity>

                <View style={styles.statusBox}>
                  <Text style={styles.statusLabel}>Status (auto)</Text>
                  <Text style={styles.statusValue}>{computedStatusPreview}</Text>
                  <Text style={styles.statusHint}>Status is computed from start/end dates.</Text>
                </View>

                <TouchableOpacity
                  style={[styles.saveBtn, loading && { opacity: 0.75 }]}
                  onPress={onSave}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Ionicons name="save-outline" size={18} color="#fff" />
                  )}
                  <Text style={styles.saveText}>Create prescription</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>

            {showDatePicker && (
              <DateTimePicker
                value={
                  activeDateField === "start"
                    ? parseDateStart(startDate.trim()) ?? new Date()
                    : parseDateEnd(endDate.trim()) ?? new Date()
                }
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                themeVariant="light"
                onChange={handleDateChange}
              />
            )}

            {showTimePickerIndex !== null && (
              <DateTimePicker
                value={parseHHMMToDate(times[showTimePickerIndex] ?? "")}
                mode="time"
                is24Hour
                display={Platform.OS === "ios" ? "spinner" : "default"}
                themeVariant="light"
                onChange={handleTimeChange}
              />
            )}
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
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
  label: { fontSize: 12, fontWeight: "800", color: "#111827", marginBottom: 8 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    color: "#111827",
  },
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
  chipActive: { backgroundColor: "#13a4ec", borderColor: "#13a4ec" },
  chipText: { fontWeight: "900", color: "#0f172a", fontSize: 12 },
  chipTextActive: { color: "#fff" },
  statusBox: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#fff",
    gap: 4,
  },
  statusLabel: { fontSize: 12, fontWeight: "900", color: "#64748b" },
  statusValue: { fontSize: 14, fontWeight: "900", color: "#111827" },
  statusHint: { fontSize: 11, fontWeight: "700", color: "#94a3b8", lineHeight: 16 },
  saveBtn: {
    marginTop: 12,
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
