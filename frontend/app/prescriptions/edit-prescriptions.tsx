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
  // Champs de la prescription
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
        setTime(data.time || ""); // si tu as ajouté time
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible de charger la prescription.");
    } finally {
      setLoading(false);
    }
  };

  fetchPrescription();
}, [id]);


  const handleSavePrescription = async () => {
    const user = auth.currentUser;
    
    const ref = doc(db, "prescriptions", user.uid, "userPrescriptions", id);
    if (!user) {
      Alert.alert("Erreur", "Utilisateur non connecté");
      return;
    }

    const dosageValue = `${dose} ${unit}`;
    if (!medicationName || !dosageValue || !frequency || !startDate) {
      Alert.alert(
        "Champs manquants",
        "Nom, dosage, fréquence, date de début sont obligatoires."
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

      Alert.alert("Succès", "Prescription modifiée !");
      router.push("/prescriptions");
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible d'ajouter la prescription.");
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
        <Text style={styles.headerTitle}>Modifier Prescription</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        {/* Nom du médicament */}
        <Text style={styles.label}>Nom du médicament</Text>
        <TextInput
          placeholder="Ex : Paracétamol"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          value={medicationName}
          onChangeText={setMedicationName}
        />

        {/* Dose moderne */}
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

        {/* Fréquence avec raccourcis */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fréquence</Text>
          <View style={styles.chipsWrap}>
            {["1/jour", "2/jour", "3/jour", "4/jour", "Toutes 8h"].map((f) => (
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
            placeholder="Ex : 2 fois par jour"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            value={frequency}
            onChangeText={setFrequency}
          />
        </View>

        {/* Période (avec calendrier) */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Période</Text>
          </View>

          <View style={styles.dateRow}> 
            <View style={styles.dateField}>
              <Text style={styles.inputLabel}>Début</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setStartPickerOpen(true)}>
                <Ionicons name="calendar" size={16} color="#111827" />
                <Text style={styles.dateButtonText}>{startDate || "Choisir une date"}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dateField}>
              <Text style={styles.inputLabel}>Fin</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setEndPickerOpen(true)}>
                <Ionicons name="calendar" size={16} color="#111827" />
                <Text style={styles.dateButtonText}>{endDate || "Choisir une date"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Heure de prise (optionnelle) */}
<View style={styles.card}>
  <Text style={styles.cardTitle}>Heure de prise </Text>
  <TouchableOpacity
    style={styles.dateButton}
    onPress={() => setShowTimePicker(true)}
  >
    <Ionicons name="time-outline" size={16} color="#111827" />
    <Text style={styles.dateButtonText}>
      {time || "Choisir une heure"}
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
          placeholder="Ex : À prendre après le repas"
          placeholderTextColor="#9CA3AF"
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        {/* BOUTON ENREGISTRER */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSavePrescription}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>Enregistrer</Text>
        </TouchableOpacity>
      </ScrollView>
      {/* Calendriers modaux */}
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

//
// Styles
//
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f8fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    textAlign: "center",
  },
  form: {
    padding: 20,
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#111827",
  },
  textArea: {
    height: 80,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 10,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    minWidth: 90,
    textAlign: "center",
  },
  unitRow: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipActive: {
    backgroundColor: "#0A84FF10",
    borderColor: "#0A84FF",
  },
  chipText: {
    color: "#111827",
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#0A84FF",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  dateToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  dateInputs: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  dateField: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: "#111827",
  },
  saveButton: {
    backgroundColor: "#0A84FF",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

// Lightweight calendar modal without external dependencies
function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function fmt(date: Date) { return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`; }

function buildMonthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7; // make Monday=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

type CalProps = {
  visible: boolean;
  initialDate?: string;
  onClose: () => void;
  onSelect: (dateISO: string) => void;
};

function CalendarModal({ visible, initialDate, onClose, onSelect }: CalProps) {
  const base = initialDate ? new Date(initialDate) : new Date();
  const [year, setYear] = React.useState(base.getFullYear());
  const [month, setMonth] = React.useState(base.getMonth());
  const weeks = buildMonthMatrix(year, month);

  const prevMonth = () => {
    const m = month - 1;
    if (m < 0) { setMonth(11); setYear((y) => y - 1); } else setMonth(m);
  };
  const nextMonth = () => {
    const m = month + 1;
    if (m > 11) { setMonth(0); setYear((y) => y + 1); } else setMonth(m);
  };

  if (!visible) return null;
  return (
    <View style={calStyles.backdrop}>
      <View style={calStyles.modal}>
        <View style={calStyles.headerRow}>
          <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn}>
            <Ionicons name="chevron-back" size={18} color="#111827" />
          </TouchableOpacity>
          <Text style={calStyles.title}>{pad(month + 1)}/{year}</Text>
          <TouchableOpacity onPress={nextMonth} style={calStyles.navBtn}>
            <Ionicons name="chevron-forward" size={18} color="#111827" />
          </TouchableOpacity>
        </View>
        <View style={calStyles.weekHeader}>
          {["L", "M", "M", "J", "V", "S", "D"].map((d, idx) => (
            <Text key={idx} style={calStyles.weekCell}>{d}</Text>
          ))}
        </View>
        {weeks.map((row, i) => (
          <View key={i} style={calStyles.row}>
            {row.map((cell, j) => (
              <TouchableOpacity
                key={j}
                style={[calStyles.cell, !cell && calStyles.cellEmpty]}
                disabled={!cell}
                onPress={() => cell && onSelect(fmt(cell))}
              >
                <Text style={calStyles.cellText}>{cell ? cell.getDate() : ""}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <TouchableOpacity style={calStyles.closeBtn} onPress={onClose}>
          <Text style={calStyles.closeBtnText}>Fermer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const calStyles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    width: "88%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  navBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  weekCell: {
    width: 36,
    textAlign: "center",
    color: "#6B7280",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cell: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  cellEmpty: {
    backgroundColor: "transparent",
  },
  cellText: {
    color: "#111827",
    fontWeight: "600",
  },
  closeBtn: {
    marginTop: 8,
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#0A84FF",
  },
  closeBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
});


