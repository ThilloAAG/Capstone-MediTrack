import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../../../src/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
} from "firebase/firestore";

type Prescription = {
  id: string;
  medicationName?: string;
  dosage?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdAt?: any;
  status?: "active" | "paused" | "completed" | "suspended" | string;
};

type MissedMap = Record<string, number>;

export default function PrescriptionsScreen() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [missedMap, setMissedMap] = useState<MissedMap>({});

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "prescriptions", user.uid, "userPrescriptions"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Prescription[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Prescription[];

        setPrescriptions(data);
        setLoading(false);
      },
      (error) => {
        console.log("Load prescriptions error:", error);
        setPrescriptions([]);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setMissedMap({});
      return;
    }

    const qLogs = query(
      collection(db, "dispenseLogs"),
      where("patientId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      qLogs,
      (snapshot) => {
        const since = new Date();
        since.setDate(since.getDate() - 7);

        const nextMap: MissedMap = {};

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() as any;
          const prescriptionId = String(data?.prescriptionId || "");
          const status = String(data?.status || "").toUpperCase();
          const actualTime = data?.actualTime?.toDate?.();

          if (!prescriptionId || !actualTime || actualTime < since) return;
          if (status !== "MISSED") return;

          nextMap[prescriptionId] = (nextMap[prescriptionId] || 0) + 1;
        });

        setMissedMap(nextMap);
      },
      (error) => {
        console.log("Load dispense logs error:", error);
        setMissedMap({});
      }
    );

    return unsubscribe;
  }, []);

  const handleAddPrescription = () => {
    router.push("/patient/prescriptions/new");
  };

  const handleNavigateToTab = (tab: string) => {
    switch (tab) {
      case "dashboard":
        router.push("/patient/dashboard");
        break;
      case "machines":
        router.push("/patient/machines");
        break;
      case "notifications":
        router.push("/patient/notifications");
        break;
      case "profile":
        router.push("/patient/profile");
        break;
      default:
        break;
    }
  };

  const handleBack = () => {
    router.back();
  };

  const renderStatusPill = (status?: string) => {
    const s = (status || "active").toLowerCase();
    let color = "#22c55e";
    if (s === "paused" || s === "suspended") color = "#f59e0b";
    if (s === "completed") color = "#64748b";

    return (
      <View style={[styles.statusPill, { backgroundColor: color + "1A" }]}>
        <Text style={[styles.statusPillText, { color }]}>{s.toUpperCase()}</Text>
      </View>
    );
  };

  const renderMissedPill = (missedCount: number) => {
    const isHigh = missedCount > 3;
    const bgColor = isHigh ? "#fee2e2" : "#dcfce7";
    const borderColor = isHigh ? "#fca5a5" : "#86efac";
    const textColor = isHigh ? "#dc2626" : "#166534";

    return (
      <View
        style={[
          styles.missedPill,
          { backgroundColor: bgColor, borderColor },
        ]}
      >
        <Text style={[styles.missedPillText, { color: textColor }]}>
          Missed: {missedCount}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.wrapper}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="#111618" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Prescriptions</Text>

          <View style={styles.headerRightSpacer} />
        </View>

        <ScrollView
          style={styles.main}
          contentContainerStyle={styles.mainContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.prescriptionsContainer}>
            <View style={styles.prescriptionsList}>
              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color="#0A84FF" />
                </View>
              ) : prescriptions.length > 0 ? (
                prescriptions.map((p, index) => {
                  const missedCount = missedMap[p.id] || 0;

                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.prescriptionItem,
                        index !== prescriptions.length - 1 &&
                          styles.prescriptionItemBorder,
                      ]}
                      onPress={() => router.push(`/patient/prescriptions/${p.id}`)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.prescriptionInfo}>
                        <Text style={styles.prescriptionName}>
                          {p.medicationName || "Sans nom"}
                        </Text>
                        <Text style={styles.prescriptionDosage}>{p.dosage || "-"}</Text>
                        {(p.startDate || p.endDate) && (
                          <Text style={styles.prescriptionDates}>
                            {p.startDate || ""} {p.endDate ? `→ ${p.endDate}` : ""}
                          </Text>
                        )}
                      </View>

                      <View style={styles.prescriptionTiming}>
                        <Text style={styles.nextIntakeLabel}>Fréquence</Text>
                        <Text style={styles.nextIntakeTime}>{p.frequency || "-"}</Text>
                        {renderStatusPill(p.status)}
                        {renderMissedPill(missedCount)}
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>Aucune prescription pour le moment.</Text>
              )}
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddPrescription}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={32} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.bottomNavigation}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigateToTab("dashboard")}
            activeOpacity={0.8}
          >
            <Ionicons name="home" size={24} color="#6b7280" />
            <Text
              style={styles.navText}
              numberOfLines={1}
              ellipsizeMode="tail"
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              Dashboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
            <Ionicons name="medical" size={24} color="#0A84FF" />
            <Text
              style={[styles.navText, styles.navTextActive]}
              numberOfLines={1}
              ellipsizeMode="tail"
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              Prescriptions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigateToTab("machines")}
            activeOpacity={0.8}
          >
            <Ionicons name="hardware-chip" size={24} color="#6b7280" />
            <Text
              style={styles.navText}
              numberOfLines={1}
              ellipsizeMode="tail"
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              Machines
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigateToTab("notifications")}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications" size={24} color="#6b7280" />
            <Text
              style={styles.navText}
              numberOfLines={1}
              ellipsizeMode="tail"
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              Notifications
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigateToTab("profile")}
            activeOpacity={0.8}
          >
            <Ionicons name="person" size={24} color="#6b7280" />
            <Text
              style={styles.navText}
              numberOfLines={1}
              ellipsizeMode="tail"
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8fa" },
  wrapper: { flex: 1 },
  main: { flex: 1 },
  mainContent: { paddingBottom: 140 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#f6f7f8cc",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f3f4",
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111618",
    flex: 1,
    textAlign: "center",
  },
  headerRightSpacer: { width: 32 },

  prescriptionsContainer: { paddingHorizontal: 16, paddingTop: 16 },
  prescriptionsList: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    overflow: "hidden",
  },
  prescriptionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  prescriptionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  prescriptionInfo: { flex: 1, paddingRight: 12 },
  prescriptionName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  prescriptionDosage: { fontSize: 16, color: "#6b7280" },
  prescriptionDates: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },

  prescriptionTiming: { alignItems: "flex-end", minWidth: 110 },
  nextIntakeLabel: { fontSize: 14, color: "#6b7280", marginBottom: 4 },
  nextIntakeTime: { fontSize: 16, fontWeight: "600", color: "#000000" },

  statusPill: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillText: { fontSize: 11, fontWeight: "700" },

  missedPill: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  missedPillText: { fontSize: 11, fontWeight: "700" },

  emptyText: { textAlign: "center", padding: 20, color: "#6b7280" },
  loadingBox: { padding: 20, alignItems: "center", justifyContent: "center" },

  addButton: {
    position: "absolute",
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0A84FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0A84FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },

  bottomNavigation: {
    flexDirection: "row",
    backgroundColor: "#ffffffb3",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  navText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6b7280",
    letterSpacing: -0.3,
    textAlign: "center",
    marginTop: 4,
  },
  navTextActive: {
    fontSize: 11,
    color: "#0A84FF",
    fontWeight: "600",
    letterSpacing: -0.3,
  },
});