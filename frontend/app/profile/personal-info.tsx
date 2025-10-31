// app/profile/personal-info.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getUserProfile, updateUserProfile } from "../../services/profileService";
import { auth } from "../../src/firebase";

// 🔹 Type pour les données utilisateur
type UserProfile = {
  fullName: string;
  email: string;
  phone?: string;
  emergencyContact?: string;
};

export default function PersonalInfoScreen() {
  const [userData, setUserData] = useState<UserProfile>({
    fullName: "",
    email: "",
    phone: "",
    emergencyContact: "",
  });

  const user = auth.currentUser;

  useEffect(() => {
  if (user) {
    getUserProfile(user.uid).then((data) => {
      if (data) {
        // ⚡ Cast ou transformation pour TypeScript
        const profile: UserProfile = {
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
          emergencyContact: data.emergencyContact || "",
        };
        setUserData(profile);
      }
     });
    }
   }, []);


  const handleChange = (field: keyof UserProfile, value: string) => {
    setUserData({ ...userData, [field]: value });
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert("Erreur", "Utilisateur non connecté");
      return;
    }
    try {
      await updateUserProfile(user.uid, userData);
      Alert.alert("Succès", "Vos informations ont été mises à jour !");
      router.back();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de mettre à jour vos informations.");
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={26} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personal Info</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={userData.fullName}
            onChangeText={(text) => handleChange("fullName", text)}
            placeholder="Your full name"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: "#f3f4f6" }]}
            value={userData.email}
            editable={false}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={userData.phone}
            onChangeText={(text) => handleChange("phone", text)}
            placeholder="Your phone number"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Emergency Contact</Text>
          <TextInput
            style={styles.input}
            value={userData.emergencyContact}
            onChangeText={(text) => handleChange("emergencyContact", text)}
            placeholder="Emergency contact name or number"
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f7f8" },
  content: { padding: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
  },
  saveButton: {
    backgroundColor: "#13a4ec",
    padding: 14,
    borderRadius: 10,
    marginTop: 24,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});