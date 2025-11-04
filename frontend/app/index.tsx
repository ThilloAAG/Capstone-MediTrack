import React, { useEffect } from "react";
import { View, Text, StyleSheet, Platform, Alert } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

// ✅ Notification handler with correct behavior keys
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function SplashScreen() {
  useEffect(() => {
    const setup = async () => {
      await registerForPushNotificationsAsync();
      // Navigate after setup
      router.replace("/auth/login");
    };
    setup();
  }, []);

  async function registerForPushNotificationsAsync() {
    try {
      if (!Device.isDevice) {
        Alert.alert("Error", "Push notifications require a physical device.");
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        Alert.alert("Permission Denied", "Notifications permission not granted.");
        return;
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#13a4ec",
        });
      }
    } catch (err) {
      console.error("Error setting up notifications:", err);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Text style={styles.appName}>Meditrack</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  appName: { fontSize: 42, fontWeight: "900", color: "#000", letterSpacing: -1 },
});
