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
  base.setHours(Number(hStr), Number(mStr), 0, 0);
  return base;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default function DoctorPrescriptionEditScreen() {
  const params = useLocalSearchParams<{ id?: string | string[]; rxId?: string | string[] }>();

  const patientId = useMemo(() => {
    const v = params.id;
    return Array.isArray(v) ? v[0] : v || "";
  }, [params.id]);

  const rxId = useMemo(() => {
    const v = params.rxId;
    return Array.isArray(v) ? v[0] : v || "";
  }, [params.rxId]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [docData, setDocData] = useState<PrescriptionDoc | null>(null);

  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("");
  const [notes, setNotes] = useState("");

  const [frequencyType, setFrequencyType] = useState<FrequencyType>("DAILY");
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
  const [timesPerDay, setTimesPerDay] = useState<number>(1);
  const [times, setTimes] = useState<string[]>([""]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateField, setActiveDateField] = useState<"start" | "end">("start");

  const [showTimePickerIndex, setShowTimePickerIndex] = useState<number | null>(null);

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
          Alert.alert("Not authorized", "You are not linked to this patient.");
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

        const ftRaw = String(data.frequencyType ?? "").toUpperCase();
        const ft: FrequencyType = ftRaw === "WEEKLY" ? "WEEKLY" : "DAILY";
        setFrequencyType(ft);

        const dow = Array.isArray(data.daysOfWeek) ? (data.daysOfWeek as string[]) : [];
        setDaysOfWeek(dow);

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
      Alert.alert("Error", "Please select at least one day.");
      return false;
    }
    if (!startDate.trim() || !isValidYYYYMMDD(startDate.trim())) {
      Alert.alert("Error", "Start date is required.");
      return false;
    }
    if (!endDate.trim() || !isValidYYYYMMDD(endDate.trim())) {
      Alert.alert("Error", "End date is required.");
      return false;
    }

    const sd = parseDateStart(startDate.trim());
    const ed = parseDateEnd(endDate.trim());
    if (!sd || !ed) {
      Alert.alert("Error", "Invalid date format.");
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
      Alert.alert("Error", "Schedule mismatch. Re-check times per day.");
      return false;
    }
    if (times.some((t) => !normalizeHHMM(t))) {
      Alert.alert("Error", "Please set all intake times.");
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
        Alert.alert("Not authorized", "You are not linked to this patient.");
        return;
      }

      const sd = parseDateStart(startDate.trim())!;
      const ed = parseDateEnd(endDate.trim())!;
      const cleanTimes = times.map(normalizeHHMM).filter(Boolean) as string[];

      const nextStatus: StatusType =
        statusMode === "auto" ? (computeRxStatus(sd, ed, new Date()) as StatusType) : status;

      const ref = doc(db, "prescriptions", patientId, "userPrescriptions", rxId);

      await updateDoc(ref, {
        medicationName: medName.trim(),
        dosage: dosage.trim(),
        notes: notes.trim() ? notes.trim() : null,
        frequencyType,
        ...(frequencyType === "WEEKLY" ? { daysOfWeek } : { daysOfWeek: [] }),
        timesPerDay,
        times: cleanTimes,
        time: cleanTimes[0] ?? "",
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        startDateTs: Timestamp.fromDate(sd),
        endDateTs: Timestamp.fromDate(ed),
        statusMode,
        status: nextStatus,
        updatedAt: serverTimestamp(),
        ...(statusMode === "auto" ? { statusUpdatedAt: serverTimestamp() } : {}),
      });

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
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.chip, active && styles.chipActive]}
    >
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
            <Ionicons name="chevron-back" size={24} color="#0A84FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Prescription</Text>
          <View style={{ width: 36 }} />
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
            <Ionicons name="chevron-back" size={24} color="#0A84FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Prescription</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.empty}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.emptyTitle}>Prescription not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const autoNow = computeAutoStatusNow();

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
              <Ionicons name="chevron-back" size={24} color="#0A84FF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Prescription</Text>
            <View style={{ width: 36 }} />
          </View>

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Medication Name</Text>
              <TextInput
                placeholder="Ex: Metformin"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                value={medName}
                onChangeText={setMedName}
              />

              <Text style={[styles.label, { marginTop: 14 }]}>Dosage</Text>
              <TextInput
                placeholder="Ex: 1 pill"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                value={dosage}
                onChangeText={setDosage}
              />

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Frequency</Text>

                <View style={styles.chipsWrap}>
                  <Chip
                    label="Daily"
                    active={frequencyType === "DAILY"}
                    onPress={() => {
                      setFrequencyType("DAILY");
                      setDaysOfWeek([]);
                    }}
                  />
                  <Chip
                    label="Weekly"
                    active={frequencyType === "WEEKLY"}
                    onPress={() => setFrequencyType("WEEKLY")}
                  />
                </View>

                {frequencyType === "WEEKLY" && (
                  <>
                    <Text style={styles.inputLabel}>Days</Text>
                    <View style={styles.chipsWrap}>
                      {WEEKDAYS.map((day) => {
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

                <Text style={styles.inputLabel}>Times per day</Text>
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
                    <Text style={styles.inputLabel}>Time {index + 1}</Text>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => {
                        setShowDatePicker(false);
                        setShowTimePickerIndex(index);
                      }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="time-outline" size={16} color="#111827" />
                      <Text style={styles.dateButtonText}>
                        {t ? normalizeHHMM(t) : "Select time"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Period</Text>

                <View style={styles.dateRow}>
                  <View style={styles.dateField}>
                    <Text style={styles.inputLabel}>Start</Text>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => {
                        setShowTimePickerIndex(null);
                        setActiveDateField("start");
                        setShowDatePicker(true);
                      }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="calendar" size={16} color="#111827" />
                      <Text style={styles.dateButtonText}>{startDate || "Choose a date"}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dateField}>
                    <Text style={styles.inputLabel}>End</Text>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => {
                        setShowTimePickerIndex(null);
                        setActiveDateField("end");
                        setShowDatePicker(true);
                      }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="calendar" size={16} color="#111827" />
                      <Text style={styles.dateButtonText}>{endDate || "Choose a date"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Notes</Text>
                <TextInput
                  placeholder="Ex: take with food"
                  placeholderTextColor="#9CA3AF"
                  style={[styles.input, styles.notesInput]}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Status</Text>

                <Text style={styles.statusLine}>
                  Current: {String(status).toUpperCase()} · Mode: {String(statusMode).toUpperCase()}
                </Text>

                {statusMode === "manual" && autoNow ? (
                  <Text style={styles.statusHint}>Auto would currently be {String(autoNow).toUpperCase()}</Text>
                ) : null}

                <View style={styles.chipsWrap}>
                  <Chip label="ACTIVE" active={status === "active" && statusMode === "manual"} onPress={() => updateManualStatus("active")} />
                  <Chip label="SUSPENDED" active={status === "suspended" && statusMode === "manual"} onPress={() => updateManualStatus("suspended")} />
                  <Chip label="COMPLETED" active={status === "completed" && statusMode === "manual"} onPress={() => updateManualStatus("completed")} />
                </View>

                <TouchableOpacity
                  style={styles.resumeAutoBtn}
                  onPress={resumeAutoStatus}
                  activeOpacity={0.85}
                  disabled={saving}
                >
                  <Text style={styles.resumeAutoText}>Resume AUTO</Text>
                </TouchableOpacity>

                <Text style={styles.statusHint}>Auto preview: {computedStatusPreview || "-"}</Text>
              </View>

              <TouchableOpacity
                style={[styles.saveButton, (saving || deleting) && { opacity: 0.75 }]}
                onPress={onSave}
                disabled={saving || deleting}
                activeOpacity={0.85}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Ionicons name="save-outline" size={18} color="#fff" />}
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteButton, (saving || deleting) && { opacity: 0.75 }]}
                onPress={onDelete}
                disabled={saving || deleting}
                activeOpacity={0.85}
              >
                {deleting ? (
                  <ActivityIndicator color="#ef4444" />
                ) : (
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                )}
                <Text style={styles.deleteButtonText}>Delete Prescription</Text>
              </TouchableOpacity>

              <View style={{ height: 36 }} />
            </ScrollView>
          </KeyboardAvoidingView>

          {showDatePicker && (
            <DateTimePicker
              value={parseDateStart(activeDateField === "start" ? startDate : endDate) ?? new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              themeVariant="light"
              onChange={handleDateChange}
            />
          )}

          {showTimePickerIndex !== null && (
            <DateTimePicker
              value={parseHHMM(times[showTimePickerIndex] || "09:00")}
              mode="time"
              is24Hour
              display={Platform.OS === "ios" ? "spinner" : "default"}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#f6f7f8cc",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    flex: 1,
    textAlign: "center",
    paddingRight: 32,
  },

  form: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#111827",
  },

  card: {
    marginTop: 16,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 12,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 8,
    marginTop: 12,
  },

  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  chip: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: "#13a4ec",
    borderColor: "#13a4ec",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  chipTextActive: {
    color: "#ffffff",
  },

  stepper: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    minWidth: 24,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  dateRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  dateButton: {
    minHeight: 48,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateButtonText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
  },

  notesInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },

  statusLine: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
  },
  statusHint: {
    marginTop: 8,
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
  },

  resumeAutoBtn: {
    marginTop: 12,
    backgroundColor: "#13a4ec20",
    borderRadius: 20,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  resumeAutoText: {
    color: "#13a4ec",
    fontWeight: "700",
    fontSize: 14,
  },

  saveButton: {
    marginTop: 20,
    backgroundColor: "#13a4ec",
    height: 52,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  deleteButton: {
    marginTop: 12,
    backgroundColor: "#ef444410",
    height: 52,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  deleteButtonText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "700",
  },

  empty: {
    paddingTop: 60,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
});