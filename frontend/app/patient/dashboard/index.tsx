// app/patient/dashboard/index.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
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
  getDoc,
  doc,
} from "firebase/firestore";
import { generateUpcomingDoses } from "../../../services/upcomingDosesService";
import {
  format,
  differenceInMinutes,
  addHours,
  isAfter,
  isBefore,
} from "date-fns";

interface Prescription {
  id: string;
  medicationName?: string;
  dosage?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdAt?: any;
}

interface UpcomingDose {
  id: string;
  prescriptionId: string;
  medication: string;
  dosage: string;
  frequency: string;
  scheduledTime: Date;
  scheduledTimeString: string;
  timeUntilDose: string;
  status: "upcoming" | "overdue" | "taken";
  reminderTime?: string;
}

type LinkedDoctor = {
  id: string;
  name: string;
  email: string;
};

export default function DashboardScreen() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [upcomingDoses, setUpcomingDoses] = useState<UpcomingDose[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [linkedDoctors, setLinkedDoctors] = useState<LinkedDoctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState<boolean>(true);

  const handleAddDoctor = (): void => {
    router.push("/patient/doctors/add");
  };

  const handleDispenseNow = (): void => {
    Alert.alert("Dispense Now", "Dispensing medication...");
  };

  const handleEmergency = (): void => {
    Alert.alert("Emergency", "Calling emergency contact...");
  };

  const handleNavigateToTab = (tab: string): void => {
    switch (tab) {
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
    }
  };

  // Load prescriptions + upcoming doses
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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Prescription[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Prescription[];

      setPrescriptions(data);

      const doses = generateUpcomingDoses(data);
      setUpcomingDoses(doses);

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Load linked doctors for this patient
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLinkedDoctors([]);
      setLoadingDoctors(false);
      return;
    }

    setLoadingDoctors(true);

    const qLinks = query(
      collection(db, "doctorPatientLinks"),
      where("patientId", "==", user.uid),
      where("status", "==", "active")
    );

    const unsub = onSnapshot(
      qLinks,
      async (snap) => {
        try {
          if (snap.empty) {
            setLinkedDoctors([]);
            setLoadingDoctors(false);
            return;
          }

          const docs = await Promise.all(
            snap.docs.map(async (linkDoc) => {
              const data = linkDoc.data() as any;
              const doctorId = data.doctorId as string;
              if (!doctorId) return null;

              try {
                const userSnap = await getDoc(doc(db, "users", doctorId));
                if (!userSnap.exists()) {
                  return {
                    id: doctorId,
                    name: "Unknown doctor",
                    email: doctorId,
                  } as LinkedDoctor;
                }

                const uData = userSnap.data() as any;
                return {
                  id: userSnap.id,
                  name: uData?.name || "Doctor",
                  email: uData?.email || userSnap.id,
                } as LinkedDoctor;
              } catch {
                return {
                  id: doctorId,
                  name: "Unknown doctor",
                  email: doctorId,
                } as LinkedDoctor;
              }
            })
          );

          setLinkedDoctors(docs.filter(Boolean) as LinkedDoctor[]);
          setLoadingDoctors(false);
        } catch (e) {
          console.log("Load linkedDoctors error:", e);
          setLinkedDoctors([]);
          setLoadingDoctors(false);
        }
      },
      (err) => {
        console.log("doctorPatientLinks listen error:", err);
        setLinkedDoctors([]);
        setLoadingDoctors(false);
      }
    );

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#13a4ec" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  const formatTimeUntil = (scheduledTime: Date): string => {
    const now = new Date();
    const mins = differenceInMinutes(scheduledTime, now);
    if (mins < 60) return `in ${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `in ${hours}h ${remainingMins}m`;
  };

  const now = new Date();
  const twoHoursLater = addHours(now, 2);
  const nextTwoHoursDoses = upcomingDoses
    .filter(
      (dose) =>
        dose.status === "upcoming" &&
        isAfter(dose.scheduledTime, now) &&
        isBefore(dose.scheduledTime, twoHoursLater)
    )
    .slice(0, 10);

  const oneDayLater = addHours(now, 24);
  const totalUpcomingDoses = upcomingDoses.filter(
    (d) =>
      d.status === "upcoming" &&
      isAfter(d.scheduledTime, now) &&
      isBefore(d.scheduledTime, oneDayLater)
  ).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.wrapper}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.spacer} />
          <Text style={styles.headerTitle}>Dashboard</Text>
          {/* removed top-right Add Doctor icon */}
          <View style={styles.spacer} />
        </View>

        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          {/* Upcoming Doses */}
          <View style={styles.upcomingDosesContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Doses</Text>
              <Text style={styles.timeframeText}>Next 2 hours</Text>
            </View>

            {nextTwoHoursDoses.length > 0 ? (
              <ScrollView
                style={styles.dosesScrollView}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {nextTwoHoursDoses.map((dose) => (
                  <View key={dose.id} style={styles.doseCard}>
                    <View style={styles.doseIconContainer}>
                      <Ionicons name="medical" size={20} color="#13a4ec" />
                    </View>
                    <View style={styles.doseDetails}>
                      <Text style={styles.doseMedication}>{dose.medication}</Text>
                      <Text style={styles.doseDosage}>{dose.dosage}</Text>
                    </View>
                    <View style={styles.doseTimeContainer}>
                      <Text style={styles.doseTime}>
                        {format(dose.scheduledTime, "h:mm a")}
                      </Text>
                      <Text style={styles.doseCountdown}>
                        {formatTimeUntil(dose.scheduledTime)}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyDoses}>
                <Ionicons name="checkmark-circle-outline" size={40} color="#4ade80" />
                <Text style={styles.emptyText}>No doses in the next 2 hours</Text>
              </View>
            )}
          </View>

          {/* Health Insights */}
          <View style={styles.healthInsightsContainer}>
            <Text style={styles.sectionTitle}>Health Insights</Text>
            <View style={styles.insightsGrid}>
              <View style={styles.insightCard}>
                <Ionicons name="medical" size={20} color="#13a4ec" />
                <Text style={styles.insightValue}>{prescriptions.length}</Text>
                <Text style={styles.insightLabel}>Active Meds</Text>
              </View>
              <View style={styles.insightCard}>
                <Ionicons name="checkmark-done" size={20} color="#4ade80" />
                <Text style={styles.insightValue}>0%</Text>
                <Text style={styles.insightLabel}>Compliance</Text>
              </View>
              <View style={styles.insightCard}>
                <Ionicons name="time" size={20} color="#f59e0b" />
                <Text style={styles.insightValue}>{totalUpcomingDoses}</Text>
                <Text style={styles.insightLabel}>Upcoming</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={handleDispenseNow}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryActionText}>Dispense Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={handleEmergency}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryActionText}>Emergency</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Your Doctors */}
          <View style={styles.doctorsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Doctors</Text>
              {linkedDoctors.length > 0 && (
                <Text style={styles.timeframeText}>{linkedDoctors.length} linked</Text>
              )}
            </View>

            <View style={styles.doctorsList}>
              {loadingDoctors ? (
                <View style={{ paddingVertical: 20 }}>
                  <ActivityIndicator size="small" color="#13a4ec" />
                </View>
              ) : linkedDoctors.length === 0 ? (
                <View style={styles.emptyDoctors}>
                  <Text style={styles.emptyDoctorsText}>No doctors linked yet.</Text>
                </View>
              ) : (
                linkedDoctors.map((docItem, index) => (
                  <View
                    key={docItem.id}
                    style={[
                      styles.doctorRow,
                      index !== linkedDoctors.length - 1 && styles.doctorRowDivider,
                    ]}
                  >
                    <View style={styles.doctorAvatar}>
                      <Text style={styles.doctorAvatarText}>
                        {docItem.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.doctorName}>{docItem.name}</Text>
                      <Text style={styles.doctorEmail}>{docItem.email}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Always-visible Add Doctor button */}
            <TouchableOpacity
              style={styles.addDoctorButton}
              onPress={handleAddDoctor}
              activeOpacity={0.85}
            >
              <Ionicons name="person-add-outline" size={18} color="#ffffff" />
              <Text style={styles.addDoctorButtonText}>Add Doctor</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
            <Ionicons name="home" size={24} color="#13a4ec" />
            <Text style={[styles.navText, styles.navTextActive]}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigateToTab("prescriptions")}
            activeOpacity={0.8}
          >
            <Ionicons name="medical" size={24} color="#617c89" />
            <Text style={styles.navText}>Prescriptions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigateToTab("machines")}
            activeOpacity={0.8}
          >
            <Ionicons name="hardware-chip" size={24} color="#617c89" />
            <Text style={styles.navText}>Machines</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigateToTab("notifications")}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications" size={24} color="#617c89" />
            <Text style={styles.navText}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigateToTab("profile")}
            activeOpacity={0.8}
          >
            <Ionicons name="person" size={24} color="#617c89" />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
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
    paddingVertical: 8,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f3f4",
  },
  spacer: { width: 48 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111618" },

  main: { flex: 1, paddingHorizontal: 16 },

  upcomingDosesContainer: { marginTop: 16, marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111618" },
  timeframeText: { fontSize: 12, color: "#617c89", fontWeight: "500" },

  dosesScrollView: { maxHeight: 240, backgroundColor: "#ffffff", borderRadius: 16, padding: 12 },
  doseCard: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f3f4" },
  doseIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#e3f5ff", alignItems: "center", justifyContent: "center", marginRight: 12 },
  doseDetails: { flex: 1 },
  doseMedication: { fontSize: 14, fontWeight: "600", color: "#111618", marginBottom: 2 },
  doseDosage: { fontSize: 12, color: "#617c89" },
  doseTimeContainer: { alignItems: "flex-end" },
  doseTime: { fontSize: 14, fontWeight: "600", color: "#f59e0b", marginBottom: 2 },
  doseCountdown: { fontSize: 11, color: "#617c89" },

  emptyDoses: { backgroundColor: "#ffffff", borderRadius: 16, padding: 32, alignItems: "center" },
  emptyText: { fontSize: 14, color: "#617c89", marginTop: 8, textAlign: "center" },

  healthInsightsContainer: { marginBottom: 24 },
  insightsGrid: { flexDirection: "row", gap: 12 },
  insightCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  insightValue: { fontSize: 24, fontWeight: "700", color: "#111618", marginTop: 8 },
  insightLabel: { fontSize: 12, color: "#617c89", marginTop: 4, textAlign: "center" },

  quickActionsContainer: { marginBottom: 24 },
  quickActionsGrid: { flexDirection: "row", gap: 16 },
  primaryActionButton: {
    flex: 1,
    height: 48,
    backgroundColor: "#13a4ec",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#13a4ec",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryActionText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  secondaryActionButton: { flex: 1, height: 48, backgroundColor: "#ffffff", borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#f0f3f4" },
  secondaryActionText: { color: "#111618", fontSize: 14, fontWeight: "700" },

  doctorsContainer: { marginBottom: 24 },
  doctorsList: { backgroundColor: "#ffffff", borderRadius: 16, borderWidth: 1, borderColor: "#f0f3f4", overflow: "hidden" },

  emptyDoctors: { paddingVertical: 18, paddingHorizontal: 14, alignItems: "center" },
  emptyDoctorsText: { marginTop: 2, fontSize: 13, color: "#6b7280", textAlign: "center", fontWeight: "600" },

  doctorRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12 },
  doctorRowDivider: { borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  doctorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#e3f5ff", alignItems: "center", justifyContent: "center", marginRight: 10 },
  doctorAvatarText: { fontSize: 16, fontWeight: "800", color: "#13a4ec" },
  doctorName: { fontSize: 14, fontWeight: "800", color: "#111827" },
  doctorEmail: { fontSize: 12, fontWeight: "600", color: "#6b7280", marginTop: 2 },

  addDoctorButton: {
    marginTop: 12,
    height: 48,
    backgroundColor: "#13a4ec",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#13a4ec",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  addDoctorButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },

  bottomNavigation: {
    flexDirection: "row",
    backgroundColor: "#ffffffcc",
    borderTopWidth: 1,
    borderTopColor: "#f0f3f4",
    paddingTop: 8,
    paddingBottom: 8,
  },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8 },
  navText: { fontSize: 12, fontWeight: "500", color: "#617c89" },
  navTextActive: { color: "#13a4ec", fontWeight: "600" },
});
