import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../src/firebase";

export default function NotificationPreferencesScreen() {
  const [preferences, setPreferences] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [selectedReminders, setSelectedReminders] = useState([]);
  const [showPrescriptionPicker, setShowPrescriptionPicker] = useState(false);

  const reminderOptions = [
    { id: "at-time", label: "At medication time", minutes: 0 },
    { id: "15-before", label: "15 minutes before", minutes: 15 },
    { id: "30-before", label: "30 minutes before", minutes: 30 },
    { id: "1h-before", label: "1 hour before", minutes: 60 },
    { id: "2h-before", label: "2 hours before", minutes: 120 },
  ];

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      console.log("📋 Initializing preferences screen...");
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
      const presc = prescriptionsSnapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }));
      console.log("✅ Prescriptions loaded:", presc.length);
      setPrescriptions(presc);

      // Load preferences
      const preferencesSnapshot = await getDocs(
        collection(db, `notificationPreferences/${user.uid}/preferences`)
      );
      const prefs = preferencesSnapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }));
      console.log("✅ Preferences loaded:", prefs.length);
      setPreferences(prefs);

      setLoading(false);
    } catch (error) {
      console.error("❌ Error initializing preferences:", error);
      setLoading(false);
    }
  };

  const handleAddPreference = async () => {
    if (!selectedPrescription) {
      Alert.alert("Error", "Please select a medication");
      return;
    }

    if (selectedReminders.length === 0) {
      Alert.alert("Error", "Please select at least one reminder");
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      const reminderLabels = selectedReminders.map((id) => {
        const option = reminderOptions.find((opt) => opt.id === id);
        return option?.label || id;
      });

      const reminderMinutes = selectedReminders.map((id) => {
        const option = reminderOptions.find((opt) => opt.id === id);
        return option?.minutes || 0;
      });

      console.log("➕ Adding preference for:", selectedPrescription.medicationName);
      await addDoc(collection(db, `notificationPreferences/${user.uid}/preferences`), {
        prescriptionId: selectedPrescription.id,
        medicationName: selectedPrescription.medicationName,
        reminderTimes: reminderLabels,
        reminderMinutes: reminderMinutes,
        isActive: true,
        createdAt: new Date(),
      });

      Alert.alert("Success", "Notification preference added!");
      setModalVisible(false);
      setSelectedPrescription(null);
      setSelectedReminders([]);

      // Reload preferences
      initializeScreen();
    } catch (error) {
      console.error("❌ Error adding preference:", error);
      Alert.alert("Error", "Could not add preference");
    }
  };

  const handleDeletePreference = (prefId) => {
    Alert.alert(
      "Delete Preference",
      "Are you sure you want to delete this notification preference?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const auth = getAuth();
              const user = auth.currentUser;

              if (!user) return;

              console.log("🗑️ Deleting preference:", prefId);
              await deleteDoc(doc(db, `notificationPreferences/${user.uid}/preferences`, prefId));
              Alert.alert("Success", "Preference deleted");

              // Reload preferences
              initializeScreen();
            } catch (error) {
              console.error("❌ Error deleting:", error);
              Alert.alert("Error", "Could not delete preference");
            }
          },
        },
      ]
    );
  };

  const handleTogglePreference = async (prefId, currentValue) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) return;

      console.log("🔄 Toggling preference:", prefId, "to", !currentValue);
      await updateDoc(doc(db, `notificationPreferences/${user.uid}/preferences`, prefId), {
        isActive: !currentValue,
      });

      // Reload preferences
      initializeScreen();
    } catch (error) {
      console.error("❌ Error toggling:", error);
      Alert.alert("Error", "Could not update preference");
    }
  };

  const toggleReminder = (reminderId) => {
    if (selectedReminders.includes(reminderId)) {
      setSelectedReminders(selectedReminders.filter((id) => id !== reminderId));
    } else {
      setSelectedReminders([...selectedReminders, reminderId]);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#13a4ec" />
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Preferences</Text>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color="#13a4ec" />
          </TouchableOpacity>
        </View>

        {/* PREFERENCES LIST */}
        <View style={styles.section}>
          {preferences.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No preferences set</Text>
              <Text style={styles.emptySubtitle}>
                Add a notification preference to get started
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={styles.emptyButton}
              >
                <Text style={styles.emptyButtonText}>Add Preference</Text>
              </TouchableOpacity>
            </View>
          ) : (
            preferences.map((pref) => (
              <View key={pref.id} style={styles.preferenceCard}>
                {/* Header with Toggle */}
                <View style={styles.prefHeader}>
                  <View style={styles.prefInfo}>
                    <Text style={styles.prefMedicationName}>
                      {pref.medicationName || "Unknown Medication"}
                    </Text>
                    <Text style={styles.prefDescription}>
                      {pref.reminderTimes?.length || 0} reminder(s) set
                    </Text>
                  </View>
                  <Switch
                    value={pref.isActive !== false}
                    onValueChange={(val) =>
                      handleTogglePreference(pref.id, pref.isActive)
                    }
                    trackColor={{ false: "#D1D5DB", true: "#81C784" }}
                  />
                </View>

                {/* Reminders Tags */}
                <View style={styles.remindersList}>
                  {pref.reminderTimes?.map((reminder, idx) => (
                    <View key={idx} style={styles.reminderTag}>
                      <Ionicons name="time" size={14} color="#13a4ec" />
                      <Text style={styles.reminderTagText}>{reminder}</Text>
                    </View>
                  ))}
                </View>

                {/* Actions */}
                <View style={styles.prefActions}>
                  <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    style={styles.editButton}
                  >
                    <Ionicons name="pencil" size={16} color="#13a4ec" />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeletePreference(pref.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash" size={16} color="#EF4444" />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ADD/EDIT MODAL */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedPrescription(null);
          setSelectedReminders([]);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setSelectedPrescription(null);
                setSelectedReminders([]);
              }}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Notification</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Select Prescription */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Select Medication</Text>

              {prescriptions.length === 0 ? (
                <View style={styles.noPrescriptionsContainer}>
                  <Ionicons name="alert-circle" size={32} color="#F59E0B" />
                  <Text style={styles.noPrescriptionsText}>
                    No medications found. Please create a prescription first.
                  </Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => setShowPrescriptionPicker(!showPrescriptionPicker)}
                    style={styles.prescriptionSelector}
                  >
                    <View>
                      <Text style={styles.prescriptionSelectorLabel}>
                        {selectedPrescription?.medicationName ||
                          "Choose a medication..."}
                      </Text>
                      {selectedPrescription && (
                        <Text style={styles.prescriptionSelectorSubtitle}>
                          {selectedPrescription.dosage}
                        </Text>
                      )}
                    </View>
                    <Ionicons
                      name={showPrescriptionPicker ? "chevron-up" : "chevron-down"}
                      size={24}
                      color="#6B7280"
                    />
                  </TouchableOpacity>

                  {/* Prescription Picker Dropdown */}
                  {showPrescriptionPicker && (
                    <View style={styles.prescriptionDropdown}>
                      {prescriptions.map((pres) => (
                        <TouchableOpacity
                          key={pres.id}
                          onPress={() => {
                            setSelectedPrescription(pres);
                            setShowPrescriptionPicker(false);
                          }}
                          style={[
                            styles.prescriptionOption,
                            selectedPrescription?.id === pres.id &&
                              styles.prescriptionOptionSelected,
                          ]}
                        >
                          <View style={styles.prescriptionOptionContent}>
                            <Text
                              style={[
                                styles.prescriptionOptionName,
                                selectedPrescription?.id === pres.id &&
                                  styles.prescriptionOptionNameSelected,
                              ]}
                            >
                              {pres.medicationName || "Unknown"}
                            </Text>
                            <Text
                              style={[
                                styles.prescriptionOptionDosage,
                                selectedPrescription?.id === pres.id &&
                                  styles.prescriptionOptionDosageSelected,
                              ]}
                            >
                              {pres.dosage || "No dosage set"}
                            </Text>
                          </View>
                          {selectedPrescription?.id === pres.id && (
                            <View style={styles.checkmarkContainer}>
                              <Ionicons name="checkmark" size={20} color="#13a4ec" />
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Select Reminders */}
            {prescriptions.length > 0 && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>
                  When should you be reminded?
                </Text>
                <View style={styles.remindersGrid}>
                  {reminderOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => toggleReminder(option.id)}
                      style={[
                        styles.reminderOption,
                        selectedReminders.includes(option.id) &&
                          styles.reminderOptionSelected,
                      ]}
                    >
                      <View
                        style={[
                          styles.reminderCheckbox,
                          selectedReminders.includes(option.id) &&
                            styles.reminderCheckboxSelected,
                        ]}
                      >
                        {selectedReminders.includes(option.id) && (
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        )}
                      </View>
                      <Text style={styles.reminderOptionText}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Save Button */}
            {prescriptions.length > 0 && (
              <TouchableOpacity
                onPress={handleAddPreference}
                style={[
                  styles.saveButton,
                  (!selectedPrescription || selectedReminders.length === 0) &&
                    styles.saveButtonDisabled,
                ]}
                disabled={!selectedPrescription || selectedReminders.length === 0}
              >
                <Text style={styles.saveButtonText}>Add Notification</Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 50 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
    textAlign: "center",
  },
  addButton: {
    padding: 8,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  preferenceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  prefHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  prefInfo: {
    flex: 1,
  },
  prefMedicationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  prefDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  remindersList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  reminderTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0F7FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  reminderTagText: {
    fontSize: 12,
    color: "#13a4ec",
    fontWeight: "500",
  },
  prefActions: {
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 6,
  },
  editButtonText: {
    color: "#13a4ec",
    fontWeight: "600",
    fontSize: 14,
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 6,
  },
  deleteButtonText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 14,
  },
  // MODAL STYLES
  modalContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  noPrescriptionsContainer: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#FFFBEB",
    borderRadius: 10,
    gap: 12,
  },
  noPrescriptionsText: {
    fontSize: 14,
    color: "#92400E",
    fontWeight: "500",
    textAlign: "center",
  },
  prescriptionSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  prescriptionSelectorLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
  },
  prescriptionSelectorSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  prescriptionDropdown: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    marginTop: 8,
    overflow: "hidden",
    maxHeight: 300,
  },
  prescriptionOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  prescriptionOptionSelected: {
    backgroundColor: "#E0F7FF",
  },
  prescriptionOptionContent: {
    flex: 1,
  },
  prescriptionOptionName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1F2937",
  },
  prescriptionOptionNameSelected: {
    color: "#13a4ec",
    fontWeight: "600",
  },
  prescriptionOptionDosage: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  prescriptionOptionDosageSelected: {
    color: "#13a4ec",
  },
  checkmarkContainer: {
    marginLeft: 12,
  },
  remindersGrid: {
    gap: 10,
  },
  reminderOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  reminderOptionSelected: {
    backgroundColor: "#E0F7FF",
    borderColor: "#13a4ec",
  },
  reminderCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },
  reminderCheckboxSelected: {
    backgroundColor: "#13a4ec",
  },
  reminderOptionText: {
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#13a4ec",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  saveButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
