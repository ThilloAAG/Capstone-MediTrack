import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";


interface UserInfo {
  name: string;
  email: string;
  phone: string;
}

interface EmergencyContact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  relation: string;
}

export default function AccountInfo() {
  const navigation = useNavigation();

  const [info, setInfo] = useState<UserInfo>({
    name: "Thillo Gaye",
    email: "thillo@example.com",
    phone: "+1 613 555 0189",
  });

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [newContact, setNewContact] = useState<EmergencyContact>({
    id: "",
    firstName: "",
    lastName: "",
    phone: "",
    relation: "",
  });

  const [toastOpacity] = useState(new Animated.Value(0));

  const handleChange = (field: keyof UserInfo, value: string) => {
    setInfo({ ...info, [field]: value });
  };

  const handleContactChange = (field: keyof EmergencyContact, value: string) => {
    setNewContact({ ...newContact, [field]: value });
  };

  const showToast = (message: string) => {
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSave = () => {
    // Save profile changes in Firestore if needed
    showToast("Your information has been updated");
  };

  const addEmergencyContact = () => {
    if (!newContact.firstName || !newContact.phone) return;

    setContacts([
      ...contacts,
      { ...newContact, id: Date.now().toString() },
    ]);

    setNewContact({
      id: "",
      firstName: "",
      lastName: "",
      phone: "",
      relation: "",
    });

    showToast("Emergency contact added");
  };

  const deleteContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
    showToast("Contact deleted");
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Personal Info</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Profile Photo */}
      <View style={styles.photoContainer}>
        <View style={styles.photoCircle}>
          <Ionicons name="person-outline" size={48} color="#6b7280" />
        </View>
        <Text style={styles.changePhoto}>Change photo</Text>
      </View>

      {/* ---------------- PERSONAL INFORMATION ---------------- */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Your Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={info.name}
            onChangeText={(t) => handleChange("name", t)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={info.email}
            onChangeText={(t) => handleChange("email", t)}
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={info.phone}
            onChangeText={(t) => handleChange("phone", t)}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      {/* SAVE BUTTON */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save Changes</Text>
      </TouchableOpacity>

      {/* ---------------- EMERGENCY CONTACTS ---------------- */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Emergency Contact</Text>

        {/* Add new contact */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={newContact.firstName}
            onChangeText={(t) => handleContactChange("firstName", t)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={newContact.lastName}
            onChangeText={(t) => handleContactChange("lastName", t)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={newContact.phone}
            onChangeText={(t) => handleContactChange("phone", t)}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Relation</Text>
          <TextInput
            style={styles.input}
            placeholder="Mother, Friend, Partner..."
            value={newContact.relation}
            onChangeText={(t) => handleContactChange("relation", t)}
          />
        </View>

        <TouchableOpacity style={styles.addButton} onPress={addEmergencyContact}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Contact</Text>
        </TouchableOpacity>
      </View>

      {/* LIST OF CONTACTS */}
      {contacts.map((c) => (
        <View key={c.id} style={styles.contactCard}>
          <View>
            <Text style={styles.contactName}>{c.firstName} {c.lastName}</Text>
            <Text style={styles.contactSub}>{c.relation}</Text>
            <Text style={styles.contactSub}>{c.phone}</Text>
          </View>
          <TouchableOpacity onPress={() => deleteContact(c.id)}>
            <Ionicons name="trash-outline" size={24} color="#dc2626" />
          </TouchableOpacity>
        </View>
      ))}

      {/* Toast */}
      <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
        <Text style={styles.toastText}>Updated successfully</Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f7f8", padding: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },

  /* PHOTO */
  photoContainer: { alignItems: "center", marginBottom: 20 },
  photoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  changePhoto: { marginTop: 8, color: "#13a4ec", fontWeight: "600" },

  /* CARD */
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111827",
  },

  /* INPUTS */
  inputGroup: { marginBottom: 12 },
  label: { color: "#6b7280", fontSize: 13, marginBottom: 6 },
  input: {
    backgroundColor: "#f6f7f8",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  /* Save button */
  saveButton: {
    backgroundColor: "#13a4ec",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  saveText: { color: "#fff", fontWeight: "600", fontSize: 16 },

  /* Add contact */
  addButton: {
    backgroundColor: "#13a4ec",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
    gap: 6,
  },
  addButtonText: { color: "#fff", fontWeight: "600" },

  /* Contact list */
  contactCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contactName: { fontSize: 16, fontWeight: "600", color: "#111827" },
  contactSub: { color: "#6b7280", fontSize: 14 },

  /* Toast */
  toast: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#13a4ec",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toastText: { color: "#fff", fontWeight: "500" },
});