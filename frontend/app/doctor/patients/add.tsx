// app/doctor/patients/add.tsx
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

// ✅ Import DEFAULT (because your logs show the module only exposes "default")
import doctorPatients from "../../../src/services/doctorPatients";

export default function AddPatientScreen() {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const onLink = async () => {
    const cleanEmail = (email ?? "").trim().toLowerCase();

    if (!cleanEmail) {
      Alert.alert("Error", "Please enter a patient email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      Alert.alert("Error", "Invalid email format.");
      return;
    }

    // Safety check (helps debugging if Metro cache is weird)
    if (!doctorPatients?.addPatientToDoctorByEmail) {
      Alert.alert(
        "Error",
        "addPatientToDoctorByEmail is undefined. Restart Expo with: npx expo start -c"
      );
      return;
    }

    try {
      setLoading(true);

      const res = await doctorPatients.addPatientToDoctorByEmail({
        patientEmail: cleanEmail,
        note: (note ?? "").trim(),
      });

      Alert.alert("Success", `Patient linked ✅\nUID: ${res.patientId}`);
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Unknown error");
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Add patient</Text>

          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        <View style={styles.main}>
          <Text style={styles.label}>Patient email</Text>
          <TextInput
            style={styles.input}
            placeholder="patient@email.com"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Note (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: test patient"
            placeholderTextColor="#94a3b8"
            value={note}
            onChangeText={setNote}
          />

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={onLink}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Link Patient</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.help}>
            This will create:{" "}
            <Text style={styles.mono}>
              doctors/{"{doctorUid}"}/patients/{"{patientUid}"}
            </Text>
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

  label: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    marginBottom: 8,
  },
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
