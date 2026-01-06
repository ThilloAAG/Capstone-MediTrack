import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../src/firebase';

export default function DoctorDashboard() {
  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <Text style={styles.title}>Doctor Dashboard</Text>
        <Text style={styles.subtitle}>
          Welcome Doctor 👨‍⚕️
        </Text>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardText}>View Patients</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardText}>Prescriptions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F8',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#E2E8F0',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  logoutButton: {
    marginTop: 32,
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});