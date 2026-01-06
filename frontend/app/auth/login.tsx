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
import { doc, getDoc } from "firebase/firestore";
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
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const uid = userCredential.user.uid;

      // 1️⃣ Check DOCTOR
      const doctorRef = doc(db, "doctors", uid);
      const doctorSnap = await getDoc(doctorRef);

      if (doctorSnap.exists()) {
        router.replace("/doctor/dashboardDoctor");
        return;
      }

      // 2️⃣ Check PATIENT
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        router.replace("/dashboard");
        return;
      }

      alert("Rôle utilisateur introuvable");

    } catch (error: any) {
      alert(error.message);
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
                />

                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setPasswordVisible(!passwordVisible)}
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
              onPress={() => router.push("/auth/signupscreenUpdated")}
            >
              <Text style={styles.footerText}>
                Don't have an account?{" "}
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
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 32,
  },
  formContainer: {
    width: "100%",
    maxWidth: 320,
    gap: 16,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    fontSize: 16,
  },
  passwordWrapper: { position: "relative" },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 12,
  },
  loginButton: {
    backgroundColor: "#13a4ec",
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: { marginTop: 24 },
  footerText: { color: "#64748B" },
  createAccountText: { color: "#13a4ec", fontWeight: "700" },
});