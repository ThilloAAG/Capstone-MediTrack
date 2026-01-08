// app/doctor/patients/index.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { auth, db } from "../../../src/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import DoctorBottomNav from "../../../components/DoctorBottomNav";

type Patient = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
};

export default function DoctorPatientsScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          router.replace("/auth/login");
          return;
        }

        // Fetch patients from users collection
        const q = query(
          collection(db, "users"),
          where("role", "==", "patient"),
          orderBy("name")
        );

        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Patient[];
        setPatients(data);
      } catch (e) {
        console.log("Patients fetch error:", e);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return patients;
    return patients.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const email = (p.email || "").toLowerCase();
      return name.includes(s) || email.includes(s) || p.id.toLowerCase().includes(s);
    });
  }, [patients, search]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.wrapper}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Patients</Text>
          <TouchableOpacity onPress={() => router.push("/doctor/settings")} style={styles.iconBtn} activeOpacity={0.85}>
            <Ionicons name="settings-outline" size={22} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email"
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Content */}
        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={{ paddingTop: 40 }}>
              <ActivityIndicator size="large" color="#13a4ec" />
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={44} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No patients found</Text>
              <Text style={styles.emptySub}>Create a patient account to see it here.</Text>
            </View>
          ) : (
            <View style={styles.listCard}>
              {filtered.map((p, idx) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.row, idx !== filtered.length - 1 && styles.rowBorder]}
                  onPress={() => router.push(`/doctor/patients/${p.id}`)}
                  activeOpacity={0.85}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(p.name?.[0] || "P").toUpperCase()}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{p.name || "Unnamed patient"}</Text>
                    <Text style={styles.sub}>{p.email || p.id}</Text>
                  </View>

                  <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  searchWrap: {
    marginTop: 12,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },
  main: { flex: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  listCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "#e3f5ff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#13a4ec", fontWeight: "900" },
  name: { fontSize: 15, fontWeight: "800", color: "#111827" },
  sub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  empty: { paddingTop: 60, alignItems: "center", paddingHorizontal: 24 },
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: "800", color: "#111827" },
  emptySub: { marginTop: 4, fontSize: 13, color: "#64748b", textAlign: "center" },
});
