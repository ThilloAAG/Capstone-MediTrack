import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

/** 🔹 Types pour TypeScript */
type SettingItem = {
  id: string;
  title: string;
  icon: string;
  action: () => void;
  isDestructive?: boolean;
  subtitle?: string;
  rightText?: string;
};

type SettingSection = {
  title: string;
  items: SettingItem[];
};

/** 🔹 Gestion de la déconnexion */
function handleLogout() {
  Alert.alert("Log Out", "Are you sure you want to log out?", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Log Out",
      style: "destructive",
      onPress: () => router.push("/auth/login"),
    },
  ]);
}

/** 🔹 Sections et items du profil */
const settingsSections: SettingSection[] = [
  {
    title: "Account",
    items: [
      {
        id: "personal-info",
        title: "Personal Info",
        subtitle: "Manage your personal information",
        icon: "person-outline",
        action: () => router.push("/profile/personal-info"),
      },
      {
        id: "logout",
        title: "Log Out",
        icon: "log-out-outline",
        action: handleLogout,
      },
    ],
  },
  {
    title: "Preferences",
    items: [
      {
        id: "theme",
        title: "Theme",
        icon: "contrast-outline",
        rightText: "Light",
        action: () => console.log("Theme settings"),
      },
      {
        id: "notifications-settings",
        title: "Notifications",
        icon: "notifications-outline",
        action: () => router.push("/notifications"),
      },
    ],
  },
  {
    title: "Data",
    items: [
      {
        id: "export",
        title: "Export Data",
        icon: "download-outline",
        action: () => console.log("Export data"),
      },
    ],
  },
  {
    title: "Legal",
    items: [
      {
        id: "privacy",
        title: "Privacy Policy",
        icon: "shield-checkmark-outline",
        action: () => console.log("Privacy Policy"),
      },
    ],
  },
];

export default function ProfileScreen() {
  const handleBack = () => router.back();

  const handleNavigateToTab = (tab: string) => {
    switch (tab) {
      case "dashboard":
        router.push("/dashboard");
        break;
      case "prescriptions":
        router.push("/prescriptions");
        break;
      case "machines":
        router.push("/machines");
        break;
      case "notifications":
        router.push("/notifications");
        break;
      case "admin":
        router.push("/admin");
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.wrapper}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.spacer} />
        </View>

        {/* Main Content */}
        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionsContainer}>
            {settingsSections.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.sectionContent}>
                  {section.items.map((item, index) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.settingItem,
                        index !== section.items.length - 1 && styles.settingItemBorder,
                      ]}
                      onPress={item.action}
                      activeOpacity={0.8}
                    >
                      <View style={styles.settingLeft}>
                        <View style={styles.settingIconContainer}>
                          <Ionicons name={item.icon as any} size={24} color="#13a4ec" />
                        </View>
                        <View style={styles.settingTextContainer}>
                          <Text style={styles.settingTitle}>{item.title}</Text>
                          {item.subtitle && (
                            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.settingRight}>
                        {item.rightText ? (
                          <Text style={styles.settingRightText}>{item.rightText}</Text>
                        ) : (
                          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNavigation}>
          {["dashboard", "prescriptions", "machines", "notifications"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.navItem}
              onPress={() => handleNavigateToTab(tab)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={
                  tab === "dashboard"
                    ? "home-outline"
                    : tab === "prescriptions"
                    ? "medical-outline"
                    : tab === "machines"
                    ? "hardware-chip-outline"
                    : "notifications-outline"
                }
                size={24}
                color="#6b7280"
              />
              <Text style={styles.navText}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
            <View style={styles.activeNavIndicator}>
              <Ionicons name="person" size={24} color="#13a4ec" />
            </View>
            <Text style={[styles.navText, styles.navTextActive]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

/** 🔹 Styles */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f7f8" },
  wrapper: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827", flex: 1, textAlign: "center", paddingRight: 32 },
  spacer: { width: 32 },
  main: { flex: 1, paddingHorizontal: 16 },
  sectionsContainer: { gap: 32, paddingTop: 16, paddingBottom: 32 },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 12 },
  settingItemBorder: { borderBottomWidth: 1, borderBottomColor: "#f3f4f6", marginHorizontal: 16 },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 16, flex: 1 },
  settingIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#13a4ec10", alignItems: "center", justifyContent: "center" },
  settingTextContainer: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: "500", color: "#111827", marginBottom: 2 },
  settingSubtitle: { fontSize: 14, color: "#6b7280" },
  settingRight: { alignItems: "flex-end" },
  settingRightText: { fontSize: 16, fontWeight: "500", color: "#6b7280" },
  bottomNavigation: { flexDirection: "row", backgroundColor: "#ffffffcc", borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 8, paddingBottom: 8 },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8 },
  activeNavIndicator: { backgroundColor: "#13a4ec20", borderRadius: 20, padding: 8 },
  navText: { fontSize: 12, fontWeight: "500", color: "#6b7280" },
  navTextActive: { color: "#13a4ec", fontWeight: "700" },
});
