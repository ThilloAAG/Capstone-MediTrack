// frontend/app/doctor/patients/[id]/prescriptions/[rxId].tsx
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
import { auth, db } from "../../../../../src/firebase";
import { doc, getDoc, updateDoc, serverTimestamp, deleteDoc, Timestamp } from "firebase/firestore";
import {
  computeRxStatus,
  parseDateStart,
  parseDateEnd,
  isValidYYYYMMDD,
  formatYYYYMMDD,
} from "../../../../../services/prescriptionStatus";

type FrequencyType = "DAILY" | "WEEKLY";
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

type StatusType = "active" | "suspended" | "completed";
type StatusMode = "auto" | "manual";

type PrescriptionDoc = {
  id: string;
  medicationName?: string;
  dosage?: string;
  notes?: string | null;

  frequencyType?: FrequencyType | string;
  daysOfWeek?: string[];

  timesPerDay?: number;
  times?: string[];

  // legacy fields that might exist in older data:
  time?: string;
  frequency?: string;

  startDate?: string | null;
  endDate?: string | null;
  startDateTs?: Timestamp;
  endDateTs?: Timestamp;

  status?: StatusType | string;
  statusMode?: StatusMode | string;

  doctorId?: string;
};

function makeLinkId(patientId: string, doctorId: string) {
  // ✅ underscore-only, must match your Firestore doc ids
  return `${patientId}_${doctorId}`;
}

async function ensureActiveLink(doctorId: string, patientId: string) {
  const linkId = makeLinkId(patientId, doctorId);
  const linkSnap = await getDoc(doc(db, "doctorPatientLinks", linkId));
  if (!linkSnap.exists()) return false;
  const data = linkSnap.data() as any;
  return data?.status === "active";
}

function formatDate(date: Date) {
  const y = String(date.getFullYear());
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatHHMM(date: Date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function normalizeHHMM(value: string) {
  const s = String(value || "").trim();

  const colon = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (colon) {
    const hh = String(Math.min(23, Math.max(0, Number(colon[1])))).padStart(2, "0");
    const mm = String(Math.min(59, Math.max(0, Number(colon[2])))).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  const compact = /^(\d{2})(\d{2})$/.exec(s);
  if (compact) {
    const hh = String(Math.min(23, Math.max(0, Number(compact[1])))).padStart(2, "0");
    const mm = String(Math.min(59, Math.max(0, Number(compact[2])))).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  return "";
}

function parseHHMM(value: string) {
  const base = new Date();
  const v = normalizeHHMM(value);
  if (!v) return base;
  const [hStr, mStr] = v.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return base;
  base.setHours(h, m, 0, 0);
  return base;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default function DoctorPrescriptionEditScreen() {
  // Option B: dynamic segments => params.id and params.rxId
  const params = useLocalSearchParams<{ id?: string | string[]; rxId?: string | string[] }>();

  const patientId = useMemo(() => {
    const v = params.id;
    if (!v) return "";
    return Array.isArray(v) ? v[0] : v;
  }, [params.id]);

  const rxId = useMemo(() => {
    const v = params.rxId;
    if (!v) return "";
    return Array.isArray(v) ? v[0] : v;
  }, [params.rxId]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [docData, setDocData] = useState<PrescriptionDoc | null>(null);

  // Medication
  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("");
  const [notes, setNotes] = useState("");

  // Schedule
  const [frequencyType, setFrequencyType] = useState<FrequencyType>("DAILY");
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
  const [timesPerDay, setTimesPerDay] = useState<number>(1);
  const [times, setTimes] = useState<string[]>([""]);

  // Dates
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState(""); // YYYY-MM-DD
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateField, setActiveDateField] = useState<"start" | "end">("start");

  // Time picker (wheel)
  const [showTimePickerIndex, setShowTimePickerIndex] = useState<number | null>(null);

  // Status
  const [statusMode, setStatusMode] = useState<StatusMode>("auto");
  const [status, setStatus] = useState<StatusType>("active");

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const doctorUid = auth.currentUser?.uid;
        if (!doctorUid) {
          router.replace("/auth/login");
          return;
        }

        // If params are missing, stop loading and show debug info in the UI.
        if (!patientId || !rxId) {
          if (mounted) {
            setDocData(null);
            setLoading(false);
          }
          return;
        }

        const ok = await ensureActiveLink(doctorUid, patientId);
        if (!ok) {
          if (mounted) setLoading(false);
          Alert.alert("Not authorized", "You are not linked to this patient (active link required).");
          router.back();
          return;
        }

        const ref = doc(db, "prescriptions", patientId, "userPrescriptions", rxId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          if (mounted) {
            setDocData(null);
            setLoading(false);
          }
          return;
        }

        const data = snap.data() as any;
        const rx: PrescriptionDoc = { id: snap.id, ...data };

        if (!mounted) return;

        setDocData(rx);

        // Medication
        setMedName(data.medicationName ?? "");
        setDosage(data.dosage ?? "");
        setNotes(data.notes ?? "");

        // Dates (string preferred, fallback to Timestamp)
        const sdStr =
          (data.startDate as string) ||
          (data.startDateTs?.toDate ? formatYYYYMMDD(data.startDateTs.toDate()) : "");
        const edStr =
          (data.endDate as string) ||
          (data.endDateTs?.toDate ? formatYYYYMMDD(data.endDateTs.toDate()) : "");
        setStartDate(sdStr ?? "");
        setEndDate(edStr ?? "");

        // Status
        const mode = (data.statusMode as StatusMode) ?? "auto";
        const st = (data.status as StatusType) ?? "active";
        setStatusMode(mode === "manual" ? "manual" : "auto");
        setStatus(st === "suspended" || st === "completed" ? st : "active");

        // Schedule
        const ftRaw = String(data.frequencyType ?? "").toUpperCase();
        const ft: FrequencyType = ftRaw === "WEEKLY" ? "WEEKLY" : "DAILY";
        setFrequencyType(ft);

        const dow = Array.isArray(data.daysOfWeek) ? (data.daysOfWeek as string[]) : [];
        setDaysOfWeek(dow);

        // Times: prefer times[], fallback to legacy time
        const existingTimesFromArray = Array.isArray(data.times) ? (data.times as string[]) : [];
        const legacyTime = typeof data.time === "string" ? data.time : "";
        const merged = [
          ...existingTimesFromArray,
          ...(legacyTime && existingTimesFromArray.length === 0 ? [legacyTime] : []),
        ]
          .map(normalizeHHMM)
          .filter(Boolean);

        const tpdFromDoc =
          Number.isFinite(Number(data.timesPerDay)) && Number(data.timesPerDay) > 0
            ? Number(data.timesPerDay)
            : merged.length || 1;

        const tpd = clamp(tpdFromDoc, 1, 6);
        setTimesPerDay(tpd);

        const finalTimes = [...merged];
        while (finalTimes.length < tpd) finalTimes.push("");
        setTimes(finalTimes.slice(0, tpd));

        setLoading(false);
      } catch (e) {
        console.log("Load rx edit error", e);
        if (mounted) {
          setDocData(null);
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [patientId, rxId]);

  const computeAutoStatusNow = () => {
    const sd = parseDateStart(startDate.trim());
    const ed = parseDateEnd(endDate.trim());
    if (!sd || !ed) return null;
    return computeRxStatus(sd, ed, new Date()) as StatusType;
  };

  const computedStatusPreview = useMemo(() => {
    const sd = parseDateStart(startDate.trim());
    const ed = parseDateEnd(endDate.trim());
    if (!sd || !ed) return "";
    return String(computeRxStatus(sd, ed, new Date())).toUpperCase();
  }, [startDate, endDate]);

  const closePickers = () => {
    setShowDatePicker(false);
    setShowTimePickerIndex(null);
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setShowDatePicker(false);
      return;
    }
    if (selectedDate) {
      const next = formatDate(selectedDate);
      if (activeDateField === "start") setStartDate(next);
      else setEndDate(next);
    }
    if (Platform.OS !== "ios") setShowDatePicker(false);
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setShowTimePickerIndex(null);
      return;
    }
    if (selectedDate && showTimePickerIndex !== null) {
      const next = formatHHMM(selectedDate);
      setTimes((prev) => prev.map((t, i) => (i === showTimePickerIndex ? next : t)));
    }
    if (Platform.OS !== "ios") setShowTimePickerIndex(null);
  };

  const validate = () => {
    if (!patientId || !rxId) {
      Alert.alert("Error", "Missing route params.");
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
    if (frequencyType === "WEEKLY" && daysOfWeek.length === 0) {
      Alert.alert("Error", "Please select at least one day of the week.");
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

    if (timesPerDay < 1 || timesPerDay > 6) {
      Alert.alert("Error", "Times per day must be between 1 and 6.");
      return false;
    }

    if (times.length !== timesPerDay) {
      Alert.alert("Error", "Internal schedule mismatch. Please re-check times per day.");
      return false;
    }

    if (times.some((t) => !normalizeHHMM(t))) {
      Alert.alert("Error", "Please set all intake times (HH:mm).");
      return false;
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
      setSaving(true);

      const ok = await ensureActiveLink(doctorUid, patientId);
      if (!ok) {
        Alert.alert("Not authorized", "You are not linked to this patient (active link required).");
        return;
      }

      const sd = parseDateStart(startDate.trim())!;
      const ed = parseDateEnd(endDate.trim())!;

      const cleanTimes = times.map(normalizeHHMM).filter(Boolean) as string[];

      const nextStatus: StatusType =
        statusMode === "auto" ? (computeRxStatus(sd, ed, new Date()) as StatusType) : status;

      const ref = doc(db, "prescriptions", patientId, "userPrescriptions", rxId);

      const payload: any = {
        medicationName: medName.trim(),
        dosage: dosage.trim(),
        notes: notes.trim() ? notes.trim() : null,

        frequencyType,
        ...(frequencyType === "WEEKLY" ? { daysOfWeek } : { daysOfWeek: [] }),

        timesPerDay,
        times: cleanTimes,

        // keep legacy single time for backward compatibility if any patient screens still read it
        time: cleanTimes[0] ?? "",

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

      Alert.alert("Saved", "Prescription updated.");
    } catch (e: any) {
      console.log("Update rx error", e);
      Alert.alert("Error", e?.message ?? "Failed to update prescription.");
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
      Alert.alert("Updated", `Status set to ${String(next).toUpperCase()}`);
    } catch (e: any) {
      console.log("Manual status update error", e);
      Alert.alert("Error", e?.message ?? "Failed to update status.");
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
      Alert.alert("Auto resumed", `Status is now ${String(next).toUpperCase()}`);
    } catch (e: any) {
      console.log("Resume auto status error", e);
      Alert.alert("Error", e?.message ?? "Failed to resume auto status.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!patientId || !rxId) return;

    Alert.alert("Delete prescription", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setDeleting(true);
            const ref = doc(db, "prescriptions", patientId, "userPrescriptions", rxId);
            await deleteDoc(ref);
            Alert.alert("Deleted", "Prescription deleted.");
            router.back();
          } catch (e: any) {
            console.log("Delete rx error", e);
            Alert.alert("Error", e?.message ?? "Failed to delete prescription.");
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
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
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const Stepper = ({
    value,
    min,
    max,
    onChange,
  }: {
    value: number;
    min: number;
    max: number;
    onChange: (next: number) => void;
  }) => (
    <View style={styles.stepper}>
      <TouchableOpacity
        style={styles.stepperBtn}
        onPress={() => onChange(clamp(value - 1, min, max))}
        activeOpacity={0.85}
      >
        <Ionicons name="remove" size={18} color="#111827" />
      </TouchableOpacity>

      <Text style={styles.stepperValue}>{value}</Text>

      <TouchableOpacity
        style={styles.stepperBtn}
        onPress={() => onChange(clamp(value + 1, min, max))}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={18} color="#111827" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Prescription</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ paddingTop: 40 }}>
          <ActivityIndicator size="large" color="#13a4ec" />
        </View>
      </SafeAreaView>
    );
  }

  if (!docData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Prescription</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.empty}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.emptyTitle}>Prescription not found</Text>
          {__DEV__ ? (
            <Text style={{ marginTop: 8, color: "#64748b", fontWeight: "700", fontSize: 12 }}>
              patientId: {patientId || "—"}{"\n"}rxId: {rxId || "—"}
            </Text>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  const autoNow = computeAutoStatusNow();

  return (
    <TouchableWithoutFeedback onPress={closePickers} accessible={false}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <View style={styles.wrapper}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.85}>
              <Ionicons name="chevron-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Edit Prescription
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
              {/* STATUS CARD */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Status</Text>

                <Text style={styles.statusValue}>{String(status).toUpperCase()}</Text>
                <Text style={styles.statusHint}>
                  Mode {String(statusMode).toUpperCase()}
                  {statusMode === "manual" && autoNow ? ` (Auto would be ${String(autoNow).toUpperCase()})` : ""}
                </Text>

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

                  <View style={styles.statusBox}>
                    <Text style={styles.statusLabel}>Auto status preview</Text>
                    <Text style={styles.statusValueSmall}>{computedStatusPreview || "-"}</Text>
                    <Text style={styles.statusHintSmall}>Based on start/end dates.</Text>
                  </View>
                </View>
              </View>

              {/* MEDICATION CARD */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Medication</Text>

                <Text style={styles.label}>Medication name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Metformin"
                  placeholderTextColor="#64748b"
                  value={medName}
                  onChangeText={setMedName}
                />

                <Text style={[styles.label, { marginTop: 12 }]}>Dosage</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 1 pill"
                  placeholderTextColor="#64748b"
                  value={dosage}
                  onChangeText={setDosage}
                />

                <Text style={[styles.label, { marginTop: 12 }]}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, { height: 90, textAlignVertical: "top" }]}
                  placeholder="e.g. take with food"
                  placeholderTextColor="#64748b"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />
              </View>

              {/* SCHEDULE CARD */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Schedule</Text>

                <Text style={styles.label}>Frequency type</Text>
                <View style={styles.chipsRow}>
                  <Chip
                    label="Daily"
                    active={frequencyType === "DAILY"}
                    onPress={() => {
                      setFrequencyType("DAILY");
                      setDaysOfWeek([]);
                    }}
                  />
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

                <Text style={[styles.label, { marginTop: 12 }]}>Times per day</Text>
                <Stepper
                  value={timesPerDay}
                  min={1}
                  max={6}
                  onChange={(next) => {
                    setTimesPerDay(next);
                    setTimes((prev) => {
                      const copy = [...prev];
                      while (copy.length < next) copy.push("");
                      return copy.slice(0, next);
                    });
                  }}
                />

                {times.map((t, index) => (
                  <View key={`${index}-time`} style={{ marginTop: 12 }}>
                    <Text style={styles.label}>Time {index + 1}</Text>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.input}
                      onPress={() => {
                        setShowDatePicker(false);
                        setShowTimePickerIndex(index);
                      }}
                    >
                      <Text style={{ color: t ? "#111827" : "#64748b", fontWeight: "900" }}>
                        {t ? normalizeHHMM(t) : "Select time"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* DATES CARD */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Dates</Text>

                <Text style={styles.label}>Start date (required)</Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.input}
                  onPress={() => {
                    setShowTimePickerIndex(null);
                    setActiveDateField("start");
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={{ color: startDate ? "#111827" : "#64748b", fontWeight: "900" }}>
                    {startDate || "Select date"}
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.label, { marginTop: 12 }]}>End date (required)</Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.input}
                  onPress={() => {
                    setShowTimePickerIndex(null);
                    setActiveDateField("end");
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={{ color: endDate ? "#111827" : "#64748b", fontWeight: "900" }}>
                    {endDate || "Select date"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ACTIONS */}
              <TouchableOpacity
                style={[styles.saveBtn, (saving || deleting) && { opacity: 0.75 }]}
                onPress={onSave}
                disabled={saving || deleting}
                activeOpacity={0.85}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Ionicons name="save-outline" size={18} color="#fff" />}
                <Text style={styles.saveText}>Save changes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteBtn, (saving || deleting) && { opacity: 0.75 }]}
                onPress={onDelete}
                disabled={saving || deleting}
                activeOpacity={0.85}
              >
                {deleting ? (
                  <ActivityIndicator color="#ef4444" />
                ) : (
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                )}
                <Text style={styles.deleteText}>Delete prescription</Text>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>

          {/* DATE PICKER */}
          {showDatePicker && (
            <DateTimePicker
              value={parseDateStart(activeDateField === "start" ? startDate : endDate) ?? new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              themeVariant="light"
              onChange={handleDateChange}
            />
          )}

          {/* TIME PICKER (wheel / scrolling list) */}
          {showTimePickerIndex !== null && (
            <DateTimePicker
              value={parseHHMM(times[showTimePickerIndex] || "09:00")}
              mode="time"
              is24Hour
              display="spinner"
              themeVariant="light"
              onChange={handleTimeChange}
            />
          )}
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
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#111827", flex: 1, textAlign: "center" },

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

  chipsRow: { flexDirection: "row", gap: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: "#cbd5e1", backgroundColor: "#fff" },
  chipActive: { backgroundColor: "#13a4ec", borderColor: "#13a4ec" },
  chipText: { fontWeight: "900", color: "#0f172a", fontSize: 12 },
  chipTextActive: { color: "#fff" },

  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: { minWidth: 26, textAlign: "center", fontWeight: "900", color: "#111827", fontSize: 16 },

  statusValue: { fontSize: 14, fontWeight: "900", color: "#111827" },
  statusHint: { marginTop: 6, fontSize: 11, fontWeight: "700", color: "#94a3b8", lineHeight: 16 },

  statusBtn: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  statusBtnText: { fontWeight: "900", color: "#111827", fontSize: 12 },

  resumeAutoBtn: { backgroundColor: "#13a4ec", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  resumeAutoText: { color: "#fff", fontWeight: "900" },

  statusBox: { marginTop: 8, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 14, padding: 12, backgroundColor: "#fff", gap: 4 },
  statusLabel: { fontSize: 12, fontWeight: "900", color: "#64748b" },
  statusValueSmall: { fontSize: 14, fontWeight: "900", color: "#111827" },
  statusHintSmall: { fontSize: 11, fontWeight: "700", color: "#94a3b8", lineHeight: 16 },

  saveBtn: { marginTop: 4, backgroundColor: "#13a4ec", borderRadius: 16, paddingVertical: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  saveText: { color: "#fff", fontWeight: "900" },

  deleteBtn: { marginTop: 10, backgroundColor: "#fee2e2", borderRadius: 16, paddingVertical: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  deleteText: { color: "#ef4444", fontWeight: "900" },

  empty: { paddingTop: 60, alignItems: "center", paddingHorizontal: 16 },
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: "900", color: "#111827" },
});
