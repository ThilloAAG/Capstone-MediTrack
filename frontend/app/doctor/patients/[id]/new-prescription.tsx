// app/doctor/patients/[id]/new-prescription.tsx
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
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { auth, db } from "../../../../src/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

type FrequencyType = "DAILY" | "WEEKLY";

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

async function ensureActiveLink(doctorId: string, patientId: string) {
  // We use deterministic linkId: `${patientId}_${doctorId}`
  const linkId = `${patientId}_${doctorId}`;
  const linkSnap = await getDoc(doc(db, "doctorPatientLinks", linkId));
  if (!linkSnap.exists()) return false;
  const data = linkSnap.data() as any;
  return data?.status === "active";
}

export default function NewPrescriptionScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();

  const patientId = useMemo(() => {
    if (!params.id) return "";
    return Array.isArray(params.id) ? params.id[0] : params.id;
  }, [params.id]);

  // ----- Form state -----
  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("");
  const [notes, setNotes] = useState("");
  const [patientName, setPatientName] = useState("");
  const [loadingPatient, setLoadingPatient] = useState(true);

  const [frequencyType, setFrequencyType] = useState<FrequencyType>("DAILY");
  const [timesPerDay, setTimesPerDay] = useState("1");
  const [times, setTimes] = useState<string[]>([""]);
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<number | null>(null);
  const [activeDateField, setActiveDateField] = useState<"start" | "end">("start");

  const [loading, setLoading] = useState(false);

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
          const data = snap.data() as { fullName?: string } | undefined;
          const name = data?.fullName?.trim();
          setPatientName(name ? name : "Unknown patient");
        } else {
          setPatientName("Unknown patient");
        }
      } catch (e) {
        console.log("Load patient error:", e);
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
    const n = Number(timesPerDay);
    if (!Number.isFinite(n) || n < 1 || n > 4) {
      Alert.alert("Error", "Times per day must be a number between 1 and 4.");
      return false;
    }
    if (frequencyType === "WEEKLY" && daysOfWeek.length === 0) {
      Alert.alert("Error", "Please select at least one day of the week.");
      return false;
    }
    if (times.some((t) => !t.trim())) {
      Alert.alert("Error", "Please fill all time fields.");
      return false;
    }
    return true;
  };

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, "0");
    const d = `${date.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const formatTime = (date: Date) => {
    const h = `${date.getHours()}`.padStart(2, "0");
    const m = `${date.getMinutes()}`.padStart(2, "0");
    return `${h}:${m}`;
  };

  const parseDateString = (value: string) => {
    if (!value) return new Date();
    const [y, m, d] = value.split("-").map((v) => Number(v));
    if (!y || !m || !d) return new Date();
    return new Date(y, m - 1, d);
  };

  const parseTimeString = (value: string) => {
    const base = new Date();
    if (!value) return base;
    const [h, m] = value.split(":").map((v) => Number(v));
    if (!Number.isFinite(h) || !Number.isFinite(m)) return base;
    base.setHours(h, m, 0, 0);
    return base;
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setShowDatePicker(false);
      return;
    }
    if (selectedDate) {
      const next = formatDate(selectedDate);
      if (activeDateField === "start") {
        setStartDate(next);
      } else {
        setEndDate(next);
      }
    }
    setShowDatePicker(Platform.OS === "ios");
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setShowTimePicker(null);
      return;
    }
    if (selectedDate && showTimePicker !== null) {
      const next = formatTime(selectedDate);
      setTimes((prev) => prev.map((t, i) => (i === showTimePicker ? next : t)));
    }
    setShowTimePicker(Platform.OS === "ios" ? showTimePicker : null);
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

      // ✅ Security gate: doctor must be ACTIVE for this patient
      const ok = await ensureActiveLink(doctorUid, patientId);
      if (!ok) {
        Alert.alert(
          "Not authorized",
          "You are not linked to this patient (active link required)."
        );
        return;
      }

      const rxRef = collection(db, "prescriptions", patientId, "userPrescriptions");

      const payload = {
        createdAt: serverTimestamp(),
        doctorId: doctorUid,
        medicationName: medName.trim(),
        dosage: dosage.trim(),
        notes: notes.trim() || "",
        startDate: startDate.trim() || "",
        endDate: endDate.trim() || "",
        frequencyType,
        times: times.map((t) => t.trim()),
        ...(frequencyType === "WEEKLY" ? { daysOfWeek } : {}),
      };

      const created = await addDoc(rxRef, payload);

      Alert.alert("Success", `Prescription created ✅\nID: ${created.id}`);
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
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        setShowDatePicker(false);
        setShowTimePicker(null);
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
              <Text style={styles.cardTitle}>Patient Name</Text>
              
              <Text style={styles.value}>{loadingPatient ? "Loading..." : patientName}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Medication</Text>

              <Text style={styles.label}>Medication name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Metformin"
                placeholderTextColor="#474849"
                value={medName}
                onChangeText={setMedName}
              />

              <Text style={[styles.label, { marginTop: 12 }]}>Dosage</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1or 2.... pill"
                placeholderTextColor="#474849"
                value={dosage}
                onChangeText={setDosage}
              />

              <Text style={[styles.label, { marginTop: 12 }]}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, { height: 90, textAlignVertical: "top" }]}
                placeholder="ex: take with food"
                placeholderTextColor="#474849"
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
                    {WEEK_DAYS.map((day) => {
                      const active = daysOfWeek.includes(day);
                      return (
                        <Chip
                          key={day}
                          label={day}
                          active={active}
                          onPress={() =>
                            setDaysOfWeek((prev) =>
                              active ? prev.filter((d) => d !== day) : [...prev, day]
                            )
                          }
                        />
                      );
                    })}
                  </View>
                </>
              )}

              <Text style={[styles.label, { marginTop: 12 }]}>Times per day</Text>
              <TextInput
                style={styles.input}
                placeholder="ex: 1"
                placeholderTextColor="#474849"
                value={timesPerDay}
                onChangeText={(value) => {
                  const next = value.replace(/[^\d]/g, "");
                  setTimesPerDay(next);
                  const count = Math.min(4, Math.max(1, Number(next || "1")));
                  setTimes((prev) => {
                    const nextTimes = [...prev];
                    while (nextTimes.length < count) nextTimes.push("");
                    return nextTimes.slice(0, count);
                  });
                }}
                keyboardType="number-pad"
              />

              {times.map((time, index) => (
                <View key={`${index}-time`} style={{ marginTop: 10 }}>
                  <Text style={styles.label}>{`Time ${index + 1}`}</Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.input}
                    onPress={() => {
                      setShowDatePicker(false);
                      setShowTimePicker(index);
                    }}
                  >
                    <Text style={{ color: time ? "#111827" : "#474849" }}>
                      {time || "Select time"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}

              <Text style={[styles.label, { marginTop: 12 }]}>Start date (optional)</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.input}
                onPress={() => {
                  setShowTimePicker(null);
                  setActiveDateField("start");
                  setShowDatePicker(true);
                }}
              >
                <Text style={{ color: startDate ? "#111827" : "#474849" }}>
                  {startDate || "Select date"}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.label, { marginTop: 12 }]}>End date (optional)</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.input}
                onPress={() => {
                  setShowTimePicker(null);
                  setActiveDateField("end");
                  setShowDatePicker(true);
                }}
              >
                <Text style={{ color: endDate ? "#111827" : "#474849" }}>
                  {endDate || "Select date"}
                </Text>
              </TouchableOpacity>
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

      {showDatePicker && (
        <DateTimePicker
          value={parseDateString(activeDateField === "start" ? startDate : endDate)}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          themeVariant="light"
          onChange={handleDateChange}
        />
      )}
      {showTimePicker !== null && (
        <DateTimePicker
          value={parseTimeString(times[showTimePicker] || "")}
          mode="time"
          is24Hour
          display={Platform.OS === "ios" ? "spinner" : "default"}
          themeVariant="light"
          onChange={handleTimeChange}
        />
      )}
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
    backgroundColor: "#ffffff",
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

  muted: { fontSize: 12, fontWeight: "800", color: "#111827" },
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
