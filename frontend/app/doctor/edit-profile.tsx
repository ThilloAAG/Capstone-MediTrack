import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { auth } from "../../src/firebase";
import { doctorProfileService } from "../../services/doctorProfileService";

export default function EditDoctorProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          router.replace("/auth/login");
          return;
        }

        const data = await doctorProfileService.getProfile(uid);

        setName(data?.name || "");
        setDepartment(data?.department || "");
        setBio(data?.bio || "");
        setEmail(auth.currentUser?.email || "");
      } catch (e) {
        Alert.alert("Error", "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
        Alert.alert("Validation", "Name is required");
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        Alert.alert("Validation", "Please enter a valid email address");
        return;
    }

    if (bio.length > 300) {
        Alert.alert("Validation", "Bio cannot exceed 300 characters");
        return;
    }

    if (department.length > 50) {
        Alert.alert("Validation", "Department name is too long");
        return;
    }

    try {
        setSaving(true);
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        await doctorProfileService.updateProfile(uid, {
        name,
        department,
        bio,
        email,
        });

        Alert.alert("Success", "Profile updated successfully");
        router.back();
    } catch (e: any) {
        Alert.alert("Error", e.message || "Failed to save profile");
    } finally {
        setSaving(false);
    }
    };


  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#0A84FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Edit Profile</Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Dr. John Doe"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Department</Text>
        <TextInput
          style={styles.input}
          value={department}
          onChangeText={setDepartment}
          placeholder="Cardiology"
        />

        <Text style={styles.label}>Professional Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={bio}
          onChangeText={setBio}
          placeholder="Short professional description..."
          multiline
        />

        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          disabled={saving}
          onPress={handleSave}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f7f8",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: "#374151",
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  saveButton: {
    marginTop: 24,
    backgroundColor: "#0A84FF",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  saveText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
});