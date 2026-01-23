import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { doctorNotificationService } from "../../services/doctorNotificationService";

const ACTIVE = "#0A84FF";
const INACTIVE = "#6B7280";
const BORDER = "#E5E7EB";

export default function DoctorLayout() {
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      console.log("No user ID found");
      return;
    }

    // Fetch unread count
    const fetchUnreadCount = async () => {
      try {
        console.log("Fetching unread count for doctor:", userId);
        const count = await doctorNotificationService.getUnreadCount(userId);
        console.log("Unread count:", count);
        setUnreadCount(count);
      } catch (error) {
        console.error("Error fetching unread count in layout:", error);
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();

    // Refresh every 10 seconds
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [userId]);

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
          paddingVertical: 0,
          marginVertical: 0,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 0,
          paddingTop: 0,
        },
      }}
    >
      {/* Dashboard */}
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

      {/* Patients */}
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

      {/* Notifications */}
      <Tabs.Screen
        name="notifications/index"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ position: "relative" }}>
              <Ionicons
                name={focused ? "notifications" : "notifications-outline"}
                size={26}
                color={color}
              />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    backgroundColor: "#EF4444",
                    borderRadius: 10,
                    minWidth: 20,
                    height: 20,
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: "#FFFFFF",
                  }}
                >
                  <Text
                    style={{
                      color: "#FFF",
                      fontSize: 10,
                      fontWeight: "700",
                    }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />

      {/* Profile */}
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
