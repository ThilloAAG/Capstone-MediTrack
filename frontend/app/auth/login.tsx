import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../src/firebase";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleLogin = async () => {
    try {
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail || !password) {
        Alert.alert("Error", "Please enter email and password.");
        return;
      }

      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      console.log("✅ Logged in UID:", user.uid);

      // ✅ Single source of truth: users/{uid}
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      // Option A (recommended): user doc MUST exist (created at signup)
      // If not, create a minimal doc (but role is unknown)
      if (!userSnap.exists()) {
        // If you don't know the role here, either:
        // 1) force user to re-signup properly
        // 2) or default to patient temporarily
        await setDoc(
          userRef,
          {
            email: user.email ?? cleanEmail,
            name: user.displayName ?? null,
            role: "patient", // ⚠️ temporary default
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );

        Alert.alert(
          "Profile created",
          "We created your profile as a patient by default. If this account should be a doctor, update users/{uid}.role to 'doctor'."
        );

        router.replace("/patient/dashboard");
        return;
      }

      const role = (userSnap.data() as any)?.role;

      if (role === "doctor") {
        Alert.alert("Success", "Logged in as doctor!");
        router.replace("/doctor/dashboard");
        return;
      }

      if (role === "patient") {
        Alert.alert("Success", "Logged in as patient!");
        router.replace("/patient/dashboard");
        return;
      }

      Alert.alert(
        "Missing role",
        "Your Firestore user document exists but has no valid role. Please set users/{uid}.role to 'doctor' or 'patient'."
      );
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert("Login error", error?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.main}>
          <View style={styles.content}>
            <Text style={styles.title}>Welcome Back</Text>

            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#64748B"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />

              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#64748B"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!passwordVisible}
                  autoCapitalize="none"
                  editable={!loading}
                />

                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setPasswordVisible(!passwordVisible)}
                  disabled={loading}
                >
                  <Ionicons
                    name={passwordVisible ? "eye-off" : "eye"}
                    size={22}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, loading && { opacity: 0.6 }]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginButtonText}>Log In</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.footer}
              onPress={() => router.push("/auth/signupscreen")}
              disabled={loading}
            >
              <Text style={styles.footerText}>
                Don&apos;t have an account?{" "}
                <Text style={styles.createAccountText}>Create Account</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f7f8" },
  keyboardContainer: { flex: 1, paddingHorizontal: 24 },
  main: { flex: 1, justifyContent: "center" },
  content: { alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", color: "#0F172A", marginBottom: 32 },
  formContainer: { width: "100%", maxWidth: 320, gap: 16 },
  input: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, backgroundColor: "#F1F5F9", fontSize: 16 },
  passwordWrapper: { position: "relative" },
  eyeIcon: { position: "absolute", right: 16, top: 12 },
  loginButton: { backgroundColor: "#13a4ec", paddingVertical: 12, borderRadius: 16, alignItems: "center" },
  loginButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  footer: { marginTop: 24 },
  footerText: { color: "#64748B" },
  createAccountText: { color: "#13a4ec", fontWeight: "700" },
});
