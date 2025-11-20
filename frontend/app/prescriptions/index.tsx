import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../../src/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

type Prescription = {
  id: string;
  medicationName?: string;
  dosage?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdAt?: any;
};

export default function PrescriptionsScreen() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
      const data: Prescription[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Prescription[];
      setPrescriptions(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleAddPrescription = () => {
    router.push("/prescriptions/new");
  };

  const handleNavigateToTab = (tab: string) => {
    switch (tab) {
      case "dashboard":
        router.push("/dashboard");
        break;
      case "machines":
        router.push("/machines");
        break;
      case "notifications":
        router.push("/notifications");
        break;
      case "profile":
        router.push("/profile");
        break;
      default:
        break;
    }
  };
  const handleBack = () => {
  router.back(); // ⬅️ retourne à la page précédente
};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.wrapper}>
        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
         {/* HEADER avec flèche de retour */}
<View style={styles.header}>
  <TouchableOpacity
    style={styles.backButton}
    onPress={handleBack}
    activeOpacity={0.8}
  >
    <Ionicons name="arrow-back" size={24} color="#111618" />
  </TouchableOpacity>
  <Text style={styles.headerTitle}>Prescriptions</Text>
  
</View>


          {/* Liste des prescriptions (par utilisateur) */}
          <View style={styles.prescriptionsContainer}>
            <View style={styles.prescriptionsList}>
              {loading ? (
                <Text style={styles.emptyText}>Chargement…</Text>
              ) : prescriptions.length > 0 ? (
                prescriptions.map((p, index) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.prescriptionItem,
                      index !== prescriptions.length - 1 &&
                        styles.prescriptionItemBorder,
                    ]}
                    onPress={() => router.push(`/prescriptions/${p.id}`)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.prescriptionInfo}>
                      <Text style={styles.prescriptionName}>
                        {p.medicationName || "Sans nom"}
                      </Text>
                      <Text style={styles.prescriptionDosage}>
                        {p.dosage || "-"}
                      </Text>
                      {(p.startDate || p.endDate) && (
                        <Text style={styles.prescriptionDates}>
                          {(p.startDate || "")} {p.endDate ? `→ ${p.endDate}` : ""}
                        </Text>
                      )}
                    </View>
                    <View style={styles.prescriptionTiming}>
                      <Text style={styles.nextIntakeLabel}>Fréquence</Text>
                      <Text style={styles.nextIntakeTime}>
                        {p.frequency || "-"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>Aucune prescription pour le moment.</Text>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Bouton flottant + */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddPrescription}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={32} color="#ffffff" />
        </TouchableOpacity>

        {/* Navigation du bas */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigateToTab("dashboard")}
            activeOpacity={0.8}
          >
            <Ionicons name="home" size={24} color="#6b7280" />
            <Text style={styles.navText}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
            <Ionicons name="medical" size={24} color="#0A84FF" />
            <Text style={[styles.navText, styles.navTextActive]}>Prescriptions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigateToTab("machines")}
            activeOpacity={0.8}
          >
            <Ionicons name="hardware-chip" size={24} color="#6b7280" />
            <Text style={styles.navText}>Machines</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigateToTab("notifications")}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications" size={24} color="#6b7280" />
            <Text style={styles.navText}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigateToTab("profile")}
            activeOpacity={0.8}
          >
            <Ionicons name="person" size={24} color="#6b7280" />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f8fa",
  },
  wrapper: {
    flex: 1,
  },
  main: {
    flex: 1,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f6f7f8cc',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f3f4',
  },
  backButton: {
    padding: 4,
  },
 headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111618',
    flex: 1,
    textAlign: 'center',
    paddingRight: 32,
  },
  spacer: {
    width: 32,
  },

  prescriptionsContainer: {
    paddingHorizontal: 16,
  },
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
  prescriptionInfo: {
    flex: 1,
  },
  prescriptionName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  prescriptionDosage: {
    fontSize: 16,
    color: "#6b7280",
  },
  prescriptionDates: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  prescriptionTiming: {
    alignItems: "flex-end",
  },
  nextIntakeLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  nextIntakeTime: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  emptyText: {
    textAlign: "center",
    padding: 20,
    color: "#6b7280",
  },
  addButton: {
    position: "absolute",
    bottom: 120,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0A84FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0A84FF",
    shadowOffset: {
      width: 0,
      height: 8,
    },
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
    color: "#6b7280",
  },
  navTextActive: {
    color: "#0A84FF",
    fontWeight: "600",
  },
});

