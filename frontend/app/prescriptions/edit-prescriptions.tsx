import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { db, auth } from "../../src/firebase";
import { addDoc, collection } from "firebase/firestore";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";

export default function NewPrescriptionScreen() {
  // Prescription fields
  const [medicationName, setMedicationName] = useState("");
  const [dose, setDose] = useState<number>(500);
  const [unit, setUnit] = useState<"mg" | "g">("mg");
  const [frequency, setFrequency] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [showDates, setShowDates] = useState(false);
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);
  const [time, setTime] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);

  const handleClose = () => {
    router.back();
  };

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid || !id) {
          setLoading(false);
          return;
        }

        const ref = doc(db, "prescriptions", uid, "userPrescriptions", id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          const [d, u] = (data.dosage || "").split(" ");
          setMedicationName(data.medicationName || "");
          setDose(parseInt(d) || 0);
          setUnit(u || "mg");
          setFrequency(data.frequency || "");
          setStartDate(data.startDate || "");
          setEndDate(data.endDate || "");
          setNotes(data.notes || "");
          setTime(data.time || "");
        }
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "Unable to load prescription.");
      } finally {
        setLoading(false);
      }
    };

    fetchPrescription();
  }, [id]);

  const handleSavePrescription = async () => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Error", "User not logged in.");
      return;
    }

    const ref = doc(db, "prescriptions", user.uid, "userPrescriptions", id);
    const dosageValue = `${dose} ${unit}`;

    if (!medicationName || !dosageValue || !frequency || !startDate) {
      Alert.alert(
        "Missing fields",
        "Name, dosage, frequency, and start date are required."
      );
      return;
    }

    try {
      await updateDoc(ref, {
        medicationName,
        dosage: dosageValue,
        frequency,
        startDate,
        endDate,
        time,
        notes,
        createdAt: new Date(),
      });

      Alert.alert("Success", "Prescription updated!");
      router.push("/prescriptions");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Unable to update the prescription.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={28} color="#0A84FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Prescription</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        
        {/* Medication Name */}
        <Text style={styles.label}>Medication Name</Text>
        <TextInput
          placeholder="Ex: Acetaminophen"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          value={medicationName}
          onChangeText={setMedicationName}
        />

        {/* Dose */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dose</Text>
          <View style={styles.rowBetween}>
            <View style={styles.stepper}>
              <TouchableOpacity
                onPress={() => setDose((d) => Math.max(d - 50, 0))}
                style={styles.stepperBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="remove" size={18} color="#111827" />
              </TouchableOpacity>

              <Text style={styles.stepperValue}>{dose} {unit}</Text>

              <TouchableOpacity
                onPress={() => setDose((d) => Math.min(d + 50, 10000))}
                style={styles.stepperBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={18} color="#111827" />
              </TouchableOpacity>
            </View>

            <View style={styles.unitRow}>
              {(["mg", "g"] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  onPress={() => setUnit(u)}
                  style={[styles.chip, unit === u && styles.chipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, unit === u && styles.chipTextActive]}>
                    {u.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Frequency */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Frequency</Text>
          <View style={styles.chipsWrap}>
            {["Once a day", "Twice a day", "3 times/day", "4 times/day", "Every 8h"].map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.chip, frequency === f && styles.chipActive]}
                onPress={() => setFrequency(f)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, frequency === f && styles.chipTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            placeholder="Ex: 2 times per day"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            value={frequency}
            onChangeText={setFrequency}
          />
        </View>

        {/* Period */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Period</Text>
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.inputLabel}>Start</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setStartPickerOpen(true)}>
                <Ionicons name="calendar" size={16} color="#111827" />
                <Text style={styles.dateButtonText}>{startDate || "Choose a date"}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateField}>
              <Text style={styles.inputLabel}>End</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setEndPickerOpen(true)}>
                <Ionicons name="calendar" size={16} color="#111827" />
                <Text style={styles.dateButtonText}>{endDate || "Choose a date"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Time */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Time of Intake</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time-outline" size={16} color="#111827" />
            <Text style={styles.dateButtonText}>
              {time || "Choose a time"}
            </Text>
          </TouchableOpacity>
        </View>

        {showTimePicker && (
          <DateTimePicker
            value={new Date()}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) {
                const hours = selectedTime.getHours().toString().padStart(2, "0");
                const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
                setTime(`${hours}:${minutes}`);
              }
            }}
          />
        )}

        {/* Notes */}
        <Text style={styles.label}>Notes</Text>
        <TextInput
          placeholder="Ex: Take after meals"
          placeholderTextColor="#9CA3AF"
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSavePrescription}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Date Pickers */}
      <CalendarModal
        visible={startPickerOpen}
        initialDate={startDate}
        onClose={() => setStartPickerOpen(false)}
        onSelect={(d) => {
          setStartDate(d);
          setStartPickerOpen(false);
        }}
      />
      <CalendarModal
        visible={endPickerOpen}
        initialDate={endDate}
        onClose={() => setEndPickerOpen(false)}
        onSelect={(d) => {
          setEndDate(d);
          setEndPickerOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

/* ---- Styles ---- */
/* (unchanged — only labels were translated) */
