// app/doctor/settings/index.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { auth, db } from "../../../src/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import DoctorBottomNav from "../../../components/DoctorBottomNav";

export default function DoctorSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [doctorName, setDoctorName] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          router.replace("/auth/login");
          return;
        }
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          const data = snap.data() as any;
          setDoctorName(data?.name || "");
        }
      } catch (e) {
        console.log("Doctor settings load error:", e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            router.replace("/auth/login");
          } catch (e) {
            Alert.alert("Error", "Failed to logout.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.wrapper}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={{ paddingTop: 40 }}>
              <ActivityIndicator size="large" color="#13a4ec" />
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Account</Text>

                <View style={styles.row}>
                  <Ionicons name="person-outline" size={18} color="#64748b" />
                  <Text style={styles.rowText}>{doctorName || "Doctor"}</Text>
                </View>

                <View style={styles.row}>
                  <Ionicons name="mail-outline" size={18} color="#64748b" />
                  <Text style={styles.rowText}>{auth.currentUser?.email || "-"}</Text>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Security</Text>

                <TouchableOpacity style={styles.actionRow} activeOpacity={0.85} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                  <Text style={[styles.actionText, { color: "#ef4444" }]}>Logout</Text>
                  <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>

        <DoctorBottomNav active="settings" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f7f8" },
  wrapper: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },
  main: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  cardTitle: { fontSize: 14, fontWeight: "900", color: "#111827", marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  rowText: { fontSize: 13, color: "#111827", fontWeight: "600" },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  actionText: { flex: 1, fontSize: 14, fontWeight: "800", color: "#111827" },
});
