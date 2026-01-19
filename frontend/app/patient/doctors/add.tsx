// app/patient/doctors/add.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { auth, db } from "../../../src/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

export default function PatientAddDoctorScreen() {
  const [doctorEmail, setDoctorEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const findDoctorByEmail = async (email: string) => {
    const q = query(collection(db, "users"), where("email", "==", email));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...(d.data() as any) };
  };

  const onSendRequest = async () => {
    const patientUid = auth.currentUser?.uid;
    if (!patientUid) {
      router.replace("/auth/login");
      return;
    }

    const cleanEmail = (doctorEmail || "").trim().toLowerCase();
    if (!cleanEmail) {
      Alert.alert("Error", "Please enter a doctor email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      Alert.alert("Error", "Invalid email format.");
      return;
    }

    try {
      setLoading(true);

      const doctor = await findDoctorByEmail(cleanEmail);
      if (!doctor) {
        Alert.alert("Not found", "No doctor found with this email.");
        return;
      }

      if (doctor?.role && String(doctor.role).toLowerCase() !== "doctor") {
        Alert.alert("Not a doctor", "This user is not registered as a doctor.");
        return;
      }

      const doctorId = doctor.id;
      const linkId = `${patientUid}_${doctorId}`;
      const linkRef = doc(db, "doctorPatientLinks", linkId);

      // (Optionnel) check existence — avec les nouvelles rules, ça ne doit plus throw
      try {
        const existing = await getDoc(linkRef);
        if (existing.exists()) {
          const data = existing.data() as any;
          Alert.alert(
            "Already requested",
            `Link already exists.\nStatus: ${String(data?.status || "unknown").toUpperCase()}`
          );
          return;
        }
      } catch (e) {
        // Si jamais ça throw encore, on n'empêche pas l'utilisateur : on tente create.
        console.log("Existing link check skipped:", e);
      }

      // Create request (patient-driven)
      await setDoc(linkRef, {
        patientId: patientUid,
        doctorId,
        status: "pending",
        createdAt: serverTimestamp(),
        acceptedAt: null,
      });

      Alert.alert("Request sent ✅", "Your doctor will need to accept it.");
      router.back();
    } catch (e: any) {
      console.log("Send request error:", e);
      Alert.alert("Error", e?.message || "Failed to send request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Add Doctor</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.main}>
          <Text style={styles.label}>Doctor email</Text>
          <TextInput
            style={styles.input}
            placeholder="doctor@email.com"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            keyboardType="email-address"
            value={doctorEmail}
            onChangeText={setDoctorEmail}
          />

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={onSendRequest}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send request</Text>}
          </TouchableOpacity>

          <Text style={styles.help}>
            This creates a request in <Text style={styles.mono}>doctorPatientLinks</Text> with status{" "}
            <Text style={styles.mono}>PENDING</Text>.
          </Text>
        </View>
      </KeyboardAvoidingView>
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
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },

  main: { flex: 1, padding: 16 },
  label: { fontSize: 12, fontWeight: "800", color: "#475569", marginBottom: 8 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    color: "#0f172a",
  },
  btn: {
    marginTop: 16,
    backgroundColor: "#13a4ec",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "900" },

  help: { marginTop: 14, color: "#64748b", fontSize: 12, lineHeight: 16 },
  mono: { fontWeight: "900", color: "#334155" },
});
