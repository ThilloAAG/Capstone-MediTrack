// app/doctor/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const ACTIVE = "#0A84FF";
const INACTIVE = "#6B7280";
const BORDER = "#E5E7EB";

export default function DoctorLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,

        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: BORDER,
          height: 80,            // 👈 hauteur iOS clean
          paddingBottom: 10,
          paddingTop: 6,
        },

        tabBarItemStyle: {
          alignItems: "center",
          justifyContent: "center",
        },

        tabBarIconStyle: {
          marginBottom: 2,       // 👈 espace icône → label
        },

        tabBarLabelStyle: {
          fontSize: 12,          // 👈 taille normale
          fontWeight: "600",
        },
      }}
    >
      {/* LEFT — Settings */}
      <Tabs.Screen
        name="settings/index"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={26}           // 👈 taille icône FIX
              color={color}
            />
          ),
        }}
      />

      {/* MIDDLE — Dashboard */}
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "grid" : "grid-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />

      {/* RIGHT — Patients */}
      <Tabs.Screen
        name="patients"
        options={{
          title: "Patients",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "people" : "people-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
