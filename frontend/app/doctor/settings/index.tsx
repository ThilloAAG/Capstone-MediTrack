// app/doctor/settings/index.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { auth, db } from "../../../src/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

type DoctorProfile = {
  name?: string;
  department?: string;
  // future: photoURL, title, etc.
};

function Row({
  icon,
  iconBg = "#EFF6FF",
  iconColor = "#2563EB",
  label,
  right,
  onPress,
  showChevron = true,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg?: string;
  iconColor?: string;
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      disabled={!onPress}
      style={styles.row}
    >
      <View style={[styles.rowIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>

      <Text style={styles.rowLabel}>{label}</Text>

      {right ? (
        right
      ) : showChevron ? (
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      ) : null}
    </TouchableOpacity>
  );
}

export default function DoctorProfileScreen() {
  const [loading, setLoading] = useState(true);

  const [doctorName, setDoctorName] = useState<string>("");
  const [doctorEmail, setDoctorEmail] = useState<string>("");
  const [department, setDepartment] = useState<string>("");

  // ---- Notification preferences (placeholder local state) ----
  // Your teammate can later connect these to Firestore.
  const [urgentPatientAlerts, setUrgentPatientAlerts] = useState(true);
  const [prescriptionRenewalRequests, setPrescriptionRenewalRequests] = useState(true);
  const [missedDoseFlags, setMissedDoseFlags] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(true);

  // ---- Preferences (placeholder) ----
  const availability = useMemo(() => "Auto", []);

  useEffect(() => {
    const run = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          router.replace("/auth/login");
          return;
        }

        setDoctorEmail(auth.currentUser?.email || "");

        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          const data = snap.data() as DoctorProfile;
          setDoctorName(data?.name || "");
          setDepartment(data?.department || "");
        }
      } catch (e) {
        console.log("Doctor profile load error:", e);
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
            Alert.alert("Error", "Failed to log out.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.wrapper}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={{ paddingTop: 40 }}>
              <ActivityIndicator size="large" color="#13a4ec" />
            </View>
          ) : (
            <>
              {/* Profile card */}
              <View style={styles.profileCard}>
                <View style={styles.avatarWrap}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(doctorName?.[0] || "D").toUpperCase()}
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      // later: edit avatar/photo
                      Alert.alert("Coming soon", "Profile photo editing is not implemented yet.");
                    }}
                    style={styles.avatarEdit}
                  >
                    <Ionicons name="pencil" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.nameText}>{doctorName || "Doctor"}</Text>
                <Text style={styles.subText}>{department || "Department"}</Text>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    // later: edit bio screen
                    Alert.alert("Coming soon", "Edit Professional Bio is not implemented yet.");
                  }}
                >
                  <Text style={styles.linkText}>Edit Professional Bio</Text>
                </TouchableOpacity>
              </View>

              {/* Preferences */}
              <Text style={styles.sectionLabel}>PREFERENCES</Text>
              <View style={styles.card}>
                <Row
                  icon="calendar-outline"
                  label="Availability"
                  right={
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ color: "#64748b", fontWeight: "800" }}>{availability}</Text>
                      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                    </View>
                  }
                  onPress={() => {
                    Alert.alert("Coming soon", "Availability settings are not implemented yet.");
                  }}
                />

                <View style={styles.divider} />

                <Row
                  icon="eye-outline"
                  label="Patient Data Visibility"
                  onPress={() => {
                    Alert.alert("Coming soon", "Visibility settings are not implemented yet.");
                  }}
                />
              </View>

              {/* Notifications */}
              <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
              <View style={styles.card}>
                <Row
                  icon="alert-circle-outline"
                  iconBg="#FEF2F2"
                  iconColor="#EF4444"
                  label="Urgent Patient Alerts"
                  right={<Switch value={urgentPatientAlerts} onValueChange={setUrgentPatientAlerts} />}
                  showChevron={false}
                />

                <View style={styles.divider} />

                <Row
                  icon="document-text-outline"
                  iconBg="#EEF2FF"
                  iconColor="#4F46E5"
                  label="Prescription Renewal Requests"
                  right={
                    <Switch
                      value={prescriptionRenewalRequests}
                      onValueChange={setPrescriptionRenewalRequests}
                    />
                  }
                  showChevron={false}
                />

                <View style={styles.divider} />

                <Row
                  icon="time-outline"
                  iconBg="#FFF7ED"
                  iconColor="#F59E0B"
                  label="Missed Dose Flags"
                  right={<Switch value={missedDoseFlags} onValueChange={setMissedDoseFlags} />}
                  showChevron={false}
                />

                <View style={styles.divider} />

                <Row
                  icon="stats-chart-outline"
                  iconBg="#ECFDF5"
                  iconColor="#22C55E"
                  label="Weekly Summary"
                  right={<Switch value={weeklySummary} onValueChange={setWeeklySummary} />}
                  showChevron={false}
                />

                <Text style={styles.helperText}>
                  These toggles control which notifications you can receive to avoid being spammed.
                  The notifications inbox page will be implemented later.
                </Text>
              </View>

              {/* Account */}
              <Text style={styles.sectionLabel}>ACCOUNT</Text>
              <View style={styles.card}>
                <Row
                  icon="person-outline"
                  label={doctorName || "Doctor"}
                  right={<Text style={styles.valueText}>Name</Text>}
                  showChevron={false}
                />

                <View style={styles.divider} />

                <Row
                  icon="mail-outline"
                  label={doctorEmail || "-"}
                  right={<Text style={styles.valueText}>Email</Text>}
                  showChevron={false}
                />
              </View>

              {/* Security */}
              <Text style={styles.sectionLabel}>SECURITY</Text>
              <View style={styles.card}>
                <TouchableOpacity style={styles.logoutRow} activeOpacity={0.85} onPress={handleLogout}>
                  <View style={[styles.rowIconWrap, { backgroundColor: "#FEF2F2" }]}>
                    <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                  </View>
                  <Text style={styles.logoutText}>Log out</Text>
                  <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <View style={{ height: 24 }} />
            </>
          )}
        </ScrollView>
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

  profileCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    marginBottom: 14,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 28, fontWeight: "900", color: "#475569" },
  avatarEdit: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#0A84FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  nameText: { marginTop: 12, fontSize: 20, fontWeight: "900", color: "#111827" },
  subText: { marginTop: 4, fontSize: 14, fontWeight: "700", color: "#64748b" },
  linkText: { marginTop: 10, fontSize: 14, fontWeight: "800", color: "#0A84FF" },

  sectionLabel: {
    marginLeft: 4,
    marginTop: 8,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "900",
    color: "#64748b",
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    marginBottom: 14,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: "800", color: "#111827" },
  valueText: { fontSize: 12, fontWeight: "900", color: "#94a3b8" },

  divider: { height: 1, backgroundColor: "#f1f5f9", marginLeft: 14 },

  helperText: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    lineHeight: 18,
  },

  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  logoutText: { flex: 1, fontSize: 14, fontWeight: "900", color: "#EF4444" },
});
