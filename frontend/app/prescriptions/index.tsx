import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const mockPrescriptions = [
  {
    id: '1',
    name: 'Aspirin',
    dosage: '10mg',
    nextIntake: '8:00 AM',
  },
  {
    id: '2',
    name: 'Ibuprofen',
    dosage: '20mg',
    nextIntake: '12:00 PM',
  },
  {
    id: '3',
    name: 'Acetaminophen',
    dosage: '5mg',
    nextIntake: '6:00 PM',
  },
];

export default function PrescriptionsScreen() {
  const handleAddPrescription = () => {
    router.push('/prescriptions/new');
  };

  const handleNavigateToTab = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        router.push('/dashboard');
        break;
      case 'machines':
        console.log('Navigate to machines');
        break;
      case 'notifications':
        console.log('Navigate to notifications');
        break;
      case 'profile':
        console.log('Navigate to profile');
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.wrapper}>
        {/* Main Content */}
        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Prescriptions</Text>
          </View>

          {/* Prescriptions List */}
          <View style={styles.prescriptionsContainer}>
            <View style={styles.prescriptionsList}>
              {mockPrescriptions.map((prescription, index) => (
                <View 
                  key={prescription.id}
                  style={[
                    styles.prescriptionItem,
                    index !== mockPrescriptions.length - 1 && styles.prescriptionItemBorder
                  ]}
                >
                  <View style={styles.prescriptionInfo}>
                    <Text style={styles.prescriptionName}>{prescription.name}</Text>
                    <Text style={styles.prescriptionDosage}>{prescription.dosage}</Text>
                  </View>
                  <View style={styles.prescriptionTiming}>
                    <Text style={styles.nextIntakeLabel}>Next intake</Text>
                    <Text style={styles.nextIntakeTime}>{prescription.nextIntake}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Floating Add Button */}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddPrescription}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={32} color="#ffffff" />
        </TouchableOpacity>

        {/* Bottom Navigation */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('dashboard')}
            activeOpacity={0.8}
          >
            <Ionicons name="home" size={24} color="#6b7280" />
            <Text style={styles.navText}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => {}}
            activeOpacity={0.8}
          >
            <Ionicons name="medical" size={24} color="#0A84FF" />
            <Text style={[styles.navText, styles.navTextActive]}>Prescriptions</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('machines')}
            activeOpacity={0.8}
          >
            <Ionicons name="hardware-chip" size={24} color="#6b7280" />
            <Text style={styles.navText}>Machines</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('notifications')}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications" size={24} color="#6b7280" />
            <Text style={styles.navText}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('profile')}
            activeOpacity={0.8}
          >
            <Ionicons name="person" size={24} color="#6b7280" />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  wrapper: {
    flex: 1,
  },
  main: {
    flex: 1,
    paddingBottom: 120, // Space for floating button and navigation
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#f7f8fa80',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'left',
  },
  prescriptionsContainer: {
    paddingHorizontal: 16,
  },
  prescriptionsList: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
  },
  prescriptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  prescriptionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  prescriptionInfo: {
    flex: 1,
  },
  prescriptionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  prescriptionDosage: {
    fontSize: 16,
    color: '#6b7280',
  },
  prescriptionTiming: {
    alignItems: 'flex-end',
  },
  nextIntakeLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  nextIntakeTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  addButton: {
    position: 'absolute',
    bottom: 120,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0A84FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A84FF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#ffffffb3',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    paddingBottom: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  navTextActive: {
    color: '#0A84FF',
    fontWeight: '600',
  },
});