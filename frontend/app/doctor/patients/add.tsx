// app/doctor/patients/add.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AddPatientScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add patient</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.main}>
        <View style={styles.card}>
          <Ionicons name="shield-checkmark-outline" size={44} color="#13a4ec" />
          <Text style={styles.title}>Secure linking enabled</Text>
          <Text style={styles.text}>
            In this version, doctors cannot add patients directly.
            {"\n\n"}
            Patients must add you from their app. Then you can accept the request in:
            {"\n\n"}
            <Text style={styles.mono}>Doctor → Patients → Requests</Text>
          </Text>

          <TouchableOpacity
            style={styles.btn}
            onPress={() => router.replace("/doctor/patients")}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Go to Patients</Text>
          </TouchableOpacity>
        </View>
      </View>
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

  main: { flex: 1, padding: 16, justifyContent: "center" },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  title: { marginTop: 10, fontSize: 16, fontWeight: "900", color: "#111827" },
  text: { marginTop: 8, fontSize: 12, fontWeight: "700", color: "#64748b", textAlign: "center", lineHeight: 18 },
  mono: { fontWeight: "900", color: "#334155" },
  btn: { marginTop: 14, backgroundColor: "#13a4ec", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14 },
  btnText: { color: "#fff", fontWeight: "900" },
});
