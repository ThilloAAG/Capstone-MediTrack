// frontend/components/DoctorBottomNav.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  active?: string;
};

export default function DoctorBottomNav({ active }: Props) {
  return (
    <View style={styles.nav}>
      <Text>Bottom Nav - active: {active}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { height: 60, backgroundColor: "#ddd", justifyContent: "center", alignItems: "center" },
});
