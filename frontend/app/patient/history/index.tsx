import React, { useEffect, useMemo, useState } from "react";
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
import Ionicons from "@expo/vector-icons/Ionicons";
import { format, isToday, isYesterday } from "date-fns";
import { auth } from "../../../src/firebase";
import { subscribePatientDispenseHistory } from "../../../services/dispenseLogService";

type DispenseLog = {
  id: string;
  medicationName?: string;
  dosage?: string;
  status: "pending" | "taken" | "missed";
  scheduledFor?: any;
};

export default function HistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<DispenseLog[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const unsub = subscribePatientDispenseHistory(
      user.uid,
      (items: DispenseLog[]) => {
        setLogs(items);
        setLoading(false);
      },
      30
    );

    return unsub;
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleNavigateToTab = (tab: string) => {
    switch (tab) {
      case "dashboard":
        router.push("/patient/dashboard");
        break;
      case "prescriptions":
        router.push("/patient/prescriptions");
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

  const getDateValue = (value: any) => {
    if (value?.toDate) return value.toDate();
    return value instanceof Date ? value : new Date();
  };

  const dayGroups = useMemo(() => {
    const grouped: { label: string; items: DispenseLog[] }[] = [];
    const map = new Map<string, DispenseLog[]>();

    logs.forEach((log) => {
      const d = getDateValue(log.scheduledFor);
      const key = format(d, "yyyy-MM-dd");

      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(log);
    });

    Array.from(map.entries()).forEach(([key, items]) => {
      const d = new Date(`${key}T00:00:00`);
      let label = format(d, "EEEE, MMM d");

      if (isToday(d)) label = "Today";
      else if (isYesterday(d)) label = "Yesterday";

      grouped.push({ label, items });
    });

    return grouped;
  }, [logs]);

  const getStatusColor = (status: DispenseLog["status"]) => {
    if (status === "taken") return "#22c55e";
    if (status === "missed") return "#ef4444";
    return "#f59e0b";
  };

  const getStatusIcon = (status: DispenseLog["status"]) => {
    if (status === "taken") return "checkmark";
    if (status === "missed") return "close";
    return "time";
  };

  const renderHistoryItem = (item: DispenseLog, isLast: boolean) => {
    const d = getDateValue(item.scheduledFor);

    return (
      <View key={item.id} style={styles.timelineItem}>
        <View
          style={[
            styles.timelineIconContainer,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Ionicons
            name={getStatusIcon(item.status)}
            size={16}
            color="#ffffff"
          />
        </View>

        <View style={styles.timelineContent}>
          <Text style={styles.timelineTitle}>
            {format(d, "h:mm a")} - {item.medicationName || "Medication"}
            {item.dosage ? `, ${item.dosage}` : ""}
          </Text>
          <Text
            style={[
              styles.timelineSubtitle,
              { color: getStatusColor(item.status) },
            ]}
          >
            {String(item.status).toUpperCase()}
          </Text>
        </View>

        {!isLast && <View style={styles.timelineLine} />}
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
          <Text style={styles.headerTitle}>Logs</Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#13a4ec"
              style={{ marginTop: 40 }}
            />
          ) : dayGroups.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="time-outline" size={52} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No logs yet</Text>
              <Text style={styles.emptyText}>
                Once doses are taken or missed, they will appear here.
              </Text>
            </View>
          ) : (
            dayGroups.map((group) => (
              <View key={group.label} style={styles.section}>
                <Text style={styles.sectionTitle}>{group.label}</Text>
                <View style={styles.timeline}>
                  {group.items.map((item, index) =>
                    renderHistoryItem(item, index === group.items.length - 1)
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.bottomNavigation}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigateToTab("dashboard")}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={24} color="#6b7280" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigateToTab("prescriptions")}
            activeOpacity={0.8}
          >
            <Ionicons name="medical-outline" size={24} color="#6b7280" />
            <Text style={styles.navText}>Medications</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
            <Ionicons name="time" size={24} color="#13a4ec" />
            <Text style={[styles.navText, styles.navTextActive]}>Logs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigateToTab("machines")}
            activeOpacity={0.8}
          >
            <Ionicons name="hardware-chip-outline" size={24} color="#6b7280" />
            <Text style={styles.navText}>Machines</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigateToTab("profile")}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={24} color="#6b7280" />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f7f8",
  },
  wrapper: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#f6f7f8cc",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111618",
    flex: 1,
    textAlign: "center",
    paddingRight: 40,
  },
  spacer: {
    width: 40,
  },
  main: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111618",
    marginBottom: 16,
  },
  timeline: {
    position: "relative",
    paddingLeft: 32,
  },
  timelineItem: {
    position: "relative",
    marginBottom: 24,
  },
  timelineIconContainer: {
    position: "absolute",
    left: -18,
    top: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  timelineContent: {
    paddingLeft: 16,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111618",
    marginBottom: 4,
    lineHeight: 22,
  },
  timelineSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  timelineLine: {
    position: "absolute",
    left: -8,
    top: 26,
    bottom: -24,
    width: 2,
    backgroundColor: "#e5e7eb",
    zIndex: 1,
  },
  empty: {
    paddingVertical: 40,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
  },
  bottomNavigation: {
    flexDirection: "row",
    backgroundColor: "#f6f7f8cc",
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
    gap: 4,
    paddingVertical: 8,
    borderRadius: 16,
  },
  navText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
  },
  navTextActive: {
    color: "#13a4ec",
    fontWeight: "700",
  },
});
