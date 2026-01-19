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
          height: 80,
          paddingBottom: 10,
          paddingTop: 6,
        },

        tabBarItemStyle: {
          alignItems: "center",
          justifyContent: "center",
        },

        tabBarIconStyle: {
          marginBottom: 2,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      {/* 1) Dashboard */}
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

      {/* 2) Patients */}
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

      {/* 3) Profile (route settings/index existante) */}
      <Tabs.Screen
        name="settings/index"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
