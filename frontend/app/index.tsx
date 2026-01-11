import React, { useEffect } from "react";
import { View, Text, StyleSheet, Platform, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../src/firebase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function Index() {
  useEffect(() => {
    let unsub: undefined | (() => void);

    const run = async () => {
      await registerForPushNotificationsAsync();

      unsub = onAuthStateChanged(auth, async (user) => {
        try {
          if (!user) {
            console.log("🚪 No user -> /auth/login");
            router.replace("/auth/login");
            return;
          }

          const uid = user.uid;
          console.log("✅ Logged in UID:", uid);

          // 🔥 On lit users/{uid} (source de vérité du rôle)
          const userRef = doc(db, "users", uid);
          const userSnap = await getDoc(userRef);

          console.log("👤 userSnap.exists():", userSnap.exists());

          const role = userSnap.exists() ? (userSnap.data() as any)?.role : null;
          console.log("🔎 users.role =", role);

          // ✅ Route selon role
          if (role === "doctor") {
            // Optionnel: s'assurer que doctors/{uid} existe (si tu veux une collection doctors)
            const doctorRef = doc(db, "doctors", uid);
            const doctorSnap = await getDoc(doctorRef);
            console.log("🩺 doctorSnap.exists():", doctorSnap.exists());

            if (!doctorSnap.exists()) {
              console.log("🛠️ doctors/{uid} missing -> creating it (optional)");
              await setDoc(
                doctorRef,
                {
                  name: (userSnap.data() as any)?.name ?? user.displayName ?? "Doctor",
                  email: (userSnap.data() as any)?.email ?? user.email ?? "",
                  role: "doctor",
                  createdAt: serverTimestamp(),
                },
                { merge: true }
              );
            }

            console.log("➡️ Routing to /doctor/dashboard");
            router.replace("/doctor/dashboard");
            return;
          }

          if (role === "patient") {
            console.log("➡️ Routing to /patient/dashboard");
            router.replace("/patient/dashboard");
            return;
          }

          // ✅ fallback si role manquant: patient par défaut ou login
          console.log("⚠️ role missing/unknown -> /patient/dashboard");
          router.replace("/patient/dashboard");
        } catch (e) {
          console.log("❌ Routing error:", e);
          router.replace("/auth/login");
        }
      });
    };

    run();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  async function registerForPushNotificationsAsync() {
    try {
      if (!Device.isDevice) return;

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") return;

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#13a4ec",
        });
      }
    } catch (err) {
      console.error("Notifications setup error:", err);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Text style={styles.appName}>Meditrack</Text>
        <ActivityIndicator style={{ marginTop: 16 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  appName: { fontSize: 42, fontWeight: "900", color: "#000", letterSpacing: -1 },
});
