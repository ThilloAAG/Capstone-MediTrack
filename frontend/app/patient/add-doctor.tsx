// app/patient/add-doctor.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { auth, db } from "../../src/firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export default function PatientAddDoctorScreen() {
  const [doctorId, setDoctorId] = useState("");
  const [loading, setLoading] = useState(false);

  const patientId = useMemo(() => auth.currentUser?.uid ?? "", []);

  const submit = async () => {
    const dId = (doctorId || "").trim();
    if (!dId) {
      Alert.alert("Error", "Please enter a doctor ID.");
      return;
    }
    if (!patientId) {
      router.replace("/auth/login");
      return;
    }
    if (dId === patientId) {
      Alert.alert("Error", "You cannot link yourself.");
      return;
    }

    try {
      setLoading(true);

      // Optional: verify doctor exists in users collection
      const doctorSnap = await getDoc(doc(db, "users", dId));
      if (!doctorSnap.exists()) {
        Alert.alert("Not found", "No user found with this Doctor ID.");
        return;
      }

      const linkId = `${patientId}_${dId}`;
      const linkRef = doc(db, "doctorPatientLinks", linkId);

      await setDoc(
        linkRef,
        {
          patientId,
          doctorId: dId,
          status: "pending",
          createdAt: serverTimestamp(),
          acceptedAt: null,
        },
        { merge: true }
      );

      Alert.alert(
        "Request sent",
        "Your doctor request was sent. The doctor must accept it."
      );
      router.back();
    } catch (e: any) {
      console.log("Add doctor request error:", e);
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
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Doctor</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.main}>
          <Text style={styles.label}>Doctor ID</Text>
          <TextInput
            style={styles.input}
            placeholder="Paste your doctor's UID"
            placeholderTextColor="#94a3b8"
            value={doctorId}
            onChangeText={setDoctorId}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.75 }]}
            onPress={submit}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send-outline" size={18} color="#fff" />
                <Text style={styles.btnText}>Send request</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.help}>
            This creates a pending request in{" "}
            <Text style={styles.mono}>doctorPatientLinks</Text>. Your doctor must
            accept it before gaining access.
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
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
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  btnText: { color: "#fff", fontWeight: "900" },
  help: { marginTop: 14, color: "#64748b", fontSize: 12, lineHeight: 16 },
  mono: { fontWeight: "900", color: "#334155" },
});
