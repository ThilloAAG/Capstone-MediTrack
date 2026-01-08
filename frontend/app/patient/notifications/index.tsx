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
import { collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../../src/firebase";


export default function NotificationsScreen() {
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    initializeScreen();
  }, []);


  const initializeScreen = async () => {
    try {
      console.log("🔔 Initializing notifications screen...");
      const auth = getAuth();
      const user = auth.currentUser;


      if (!user) {
        console.error("❌ User not authenticated");
        setLoading(false);
        return;
      }


      // Load prescriptions
      const prescriptionsSnapshot = await getDocs(
        collection(db, `prescriptions/${user.uid}/userPrescriptions`)
      );
      const prescriptions = prescriptionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("✅ Prescriptions loaded:", prescriptions.length);


      // Load preferences
      const preferencesSnapshot = await getDocs(
        collection(db, `notificationPreferences/${user.uid}/preferences`)
      );
      const preferences = preferencesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("✅ Preferences loaded:", preferences.length);


      // Generate upcoming reminders from preferences
      generateUpcomingReminders(preferences, prescriptions);
      setLoading(false);
    } catch (error) {
      console.error("❌ Error initializing notifications:", error);
      setLoading(false);
    }
  };


  const generateUpcomingReminders = (prefs, presc) => {
    const remindersArray = [];


    prefs.forEach((pref) => {
      // Skip inactive preferences
      if (!pref.isActive) return;


      // Find the matching prescription
      const prescription = presc.find((p) => p.id === pref.prescriptionId);
      if (!prescription) {
        console.warn(`⚠️ Prescription not found for preference: ${pref.prescriptionId}`);
        return;
      }


      // Get medication time from prescription
      const medTime = prescription.time || "09:00";


      // Parse time (HH:MM format)
      const [hours, minutes] = medTime.split(":").map(Number);
      const medicationTime = new Date();
      medicationTime.setHours(hours, minutes, 0);


      // Get reminder minutes from preferences
      const reminderMinutes = pref.reminderMinutes || [0];


      // Create a reminder for each reminder time
      reminderMinutes.forEach((mins, idx) => {
        const reminderTime = new Date(medicationTime);
        reminderTime.setMinutes(reminderTime.getMinutes() - mins);


        // Calculate time until reminder
        const now = new Date();
        const diffMs = reminderTime.getTime() - now.getTime();
        const diffMins = Math.round(diffMs / 60000);


        // Only include upcoming reminders (next 24 hours)
        if (diffMins > -60) {
          let status = "future";
          let timeDisplay = "";


          if (diffMins < 0) {
            status = "overdue";
            timeDisplay = `${Math.abs(diffMins)} minutes ago`;
          } else if (diffMins === 0) {
            status = "now";
            timeDisplay = "Now!";
          } else if (diffMins < 60) {
            status = "upcoming";
            timeDisplay = `in ${diffMins} minute${diffMins !== 1 ? "s" : ""}`;
          } else {
            const hoursUntil = Math.floor(diffMins / 60);
            const minsRemaining = diffMins % 60;
            timeDisplay = `in ${hoursUntil}h ${minsRemaining}m`;
            status = "upcoming";
          }


          remindersArray.push({
            id: `${pref.id}-${idx}`,
            prefId: pref.id,
            prescriptionId: pref.prescriptionId,
            medicationName: pref.medicationName || prescription.medicationName,
            reminderLabel: pref.reminderTimes?.[idx] || "Reminder",
            reminderTime: reminderTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            timeDisplay,
            status,
            diffMins,
            dosage: prescription.dosage,
            frequency: prescription.frequency,
          });
        }
      });
    });


    // Sort by time (nearest first)
    remindersArray.sort((a, b) => a.diffMins - b.diffMins);
    setUpcomingReminders(remindersArray);
  };


  const getStatusIcon = (status) => {
    switch (status) {
      case "now":
        return "alert-circle";
      case "upcoming":
        return "time";
      case "overdue":
        return "warning";
      default:
        return "time";
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
      case "now":
        return "#EF4444";
      case "upcoming":
        return "#F59E0B";
      case "overdue":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };


  const handleOpenPreferences = () => {
    router.push("/patient/notifications/preferences");
  };


  const handleNavigateToTab = (tab) => {
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
        break;
      case "profile":
        router.push("/patient/profile");
        break;
      default:
        break;
    }
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#13a4ec" />
          <Text style={styles.loadingText}>Loading reminders...</Text>
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.wrapper}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="#111618" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity
            onPress={handleOpenPreferences}
            style={styles.settingsButton}
            activeOpacity={0.8}
          >
            <Ionicons name="settings-outline" size={24} color="#111618" />
          </TouchableOpacity>
        </View>


        {/* Main Content */}
        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          {/* Upcoming Reminders Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Reminders</Text>


            {upcomingReminders.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="happy" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>All caught up!</Text>
                <Text style={styles.emptySubtitle}>
                  No reminders scheduled. Add a notification preference to get started.
                </Text>
                <TouchableOpacity
                  onPress={handleOpenPreferences}
                  style={styles.emptyButton}
                >
                  <Text style={styles.emptyButtonText}>Set Preferences</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.remindersList}>
                {upcomingReminders.map((reminder) => (
                  <View
                    key={reminder.id}
                    style={[
                      styles.reminderCard,
                      reminder.status === "now" && styles.reminderCardNow,
                      reminder.status === "overdue" && styles.reminderCardOverdue,
                    ]}
                  >
                    {/* Header with Toggle */}
                    <View style={styles.cardHeader}>
                      <View style={styles.medicationInfo}>
                        <Text style={styles.medicationName}>
                          {reminder.medicationName}
                        </Text>
                        <Text style={styles.reminderCount}>
                          Reminder {reminder.timeDisplay}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(reminder.status) },
                        ]}
                      >
                        <Ionicons
                          name={getStatusIcon(reminder.status)}
                          size={16}
                          color="#fff"
                        />
                      </View>
                    </View>


                    {/* Reminder Tags */}
                    <View style={styles.tagsContainer}>
                      <View style={styles.reminderTag}>
                        <Ionicons name="time" size={12} color="#13a4ec" />
                        <Text style={styles.tagText}>{reminder.reminderLabel}</Text>
                      </View>
                      <View style={styles.reminderTag}>
                        <Ionicons name="medical" size={12} color="#13a4ec" />
                        <Text style={styles.tagText}>{reminder.dosage}</Text>
                      </View>
                    </View>


                    {/* Time Display */}
                    <View style={styles.timeRow}>
                      <Text style={styles.timeLabel}>Medication time:</Text>
                      <Text
                        style={[
                          styles.timeValue,
                          { color: getStatusColor(reminder.status) },
                        ]}
                      >
                        {reminder.reminderTime}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>


          {/* Info Section */}
          {upcomingReminders.length > 0 && (
            <View style={styles.infoSection}>
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#13a4ec" />
                <Text style={styles.infoText}>
                  Manage your preferences to customize reminder times
                </Text>
              </View>
            </View>
          )}
        </ScrollView>


        {/* Bottom Navigation */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigateToTab("dashboard")}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={24} color="#9ca3af" />
            <Text style={styles.navText}>Dashboard</Text>
          </TouchableOpacity>


          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigateToTab("prescriptions")}
            activeOpacity={0.8}
          >
            <Ionicons name="medical-outline" size={24} color="#9ca3af" />
            <Text style={styles.navText}>Prescriptions</Text>
          </TouchableOpacity>


          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigateToTab("machines")}
            activeOpacity={0.8}
          >
            <Ionicons name="grid-outline" size={24} color="#9ca3af" />
            <Text style={styles.navText}>Machines</Text>
          </TouchableOpacity>


          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigateToTab("notifications")}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications" size={24} color="#13a4ec" />
            <Text style={[styles.navText, styles.navTextActive]}>Notifications</Text>
          </TouchableOpacity>


          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigateToTab("profile")}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={24} color="#9ca3af" />
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#f6f7f8cc",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f3f4",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111618",
    flex: 1,
    textAlign: "center",
    paddingRight: 32,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  main: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: "#13a4ec",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  remindersList: {
    gap: 12,
  },
  reminderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  reminderCardNow: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  reminderCardOverdue: {
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  reminderCount: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  tagsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  reminderTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0F7FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tagText: {
    fontSize: 11,
    color: "#13a4ec",
    fontWeight: "500",
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
  },
  timeLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  timeValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoSection: {
    paddingHorizontal: 0,
    paddingVertical: 16,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#E0F7FF",
    borderRadius: 10,
    padding: 12,
    gap: 10,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#13a4ec",
    fontWeight: "500",
  },
  bottomNavigation: {
    flexDirection: "row",
    backgroundColor: "#f6f7f8cc",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
  },
  navText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9ca3af",
  },
  navTextActive: {
    color: "#13a4ec",
    fontWeight: "700",
  },
});
