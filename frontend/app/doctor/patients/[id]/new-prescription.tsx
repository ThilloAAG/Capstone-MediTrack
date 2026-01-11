import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import DoctorBottomNav from "../../../../components/DoctorBottomNav";

export default function NewPrescriptionScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();

  const patientId = useMemo(() => {
    if (!params.id) return "";
    return Array.isArray(params.id) ? params.id[0] : params.id;
  }, [params.id]);

  return (
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

        <View style={styles.main}>
          <Text style={styles.label}>Patient ID</Text>
          <Text style={styles.value}>{patientId || "Missing id"}</Text>

          <Text style={styles.hint}>
            If you see the patient ID here, routing is working ✅
          </Text>
        </View>

        <DoctorBottomNav active="patients" />
      </View>
    </SafeAreaView>
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
  label: { fontSize: 12, fontWeight: "800", color: "#64748b" },
  value: { marginTop: 6, fontSize: 14, fontWeight: "900", color: "#111827" },
  hint: { marginTop: 14, color: "#64748b", fontSize: 12 },
});
