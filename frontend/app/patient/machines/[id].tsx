import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const mockMachineDetails = {
  id: '1',
  name: 'Living Room Dispenser',
  status: 'Connected',
  firmwareVersion: 'v1.2.3',
  compartments: [
    { id: '1', name: 'Aspirin', pillsLeft: 2, status: 'low' },
    { id: '2', name: 'Ibuprofen', pillsLeft: 5, status: 'normal' },
    { id: '3', name: 'Paracetamol', pillsLeft: 15, status: 'full' },
    { id: '4', name: 'Empty', pillsLeft: 0, status: 'empty' },
    { id: '5', name: 'Empty', pillsLeft: 0, status: 'empty' },
    { id: '6', name: 'Empty', pillsLeft: 0, status: 'empty' },
  ],
};

export default function MachineDetailScreen() {
  const { id } = useLocalSearchParams();

  const handleBack = () => {
    router.back();
  };

  const getCompartmentStyle = (status: string) => {
    switch (status) {
      case 'full':
        return styles.compartmentFull;
      case 'normal':
        return styles.compartmentNormal;
      case 'low':
        return styles.compartmentLow;
      case 'empty':
      default:
        return styles.compartmentEmpty;
    }
  };

  const getCompartmentTextStyle = (status: string) => {
    switch (status) {
      case 'empty':
        return styles.compartmentTextEmpty;
      default:
        return styles.compartmentText;
    }
  };

  const handleNavigateToTab = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        router.push('/dashboard');
        break;
      case 'prescriptions':
        router.push('/prescriptions');
        break;
      case 'notifications':
        router.push('/notifications');
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Machine Detail</Text>
          <View style={styles.spacer} />
        </View>

        {/* Main Content */}
        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          {/* Machine Status Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Machine Status</Text>
            <View style={styles.statusCard}>
              <View style={styles.statusItem}>
                <View style={styles.statusIconContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                </View>
                <View style={styles.statusInfo}>
                  <Text style={styles.statusLabel}>Status</Text>
                  <Text style={styles.statusValue}>{mockMachineDetails.status}</Text>
                </View>
              </View>

              <View style={[styles.statusItem, styles.statusItemBorder]}>
                <View style={styles.statusIconContainer}>
                  <Ionicons name="settings-outline" size={24} color="#007AFF" />
                </View>
                <View style={styles.statusInfo}>
                  <Text style={styles.statusLabel}>Firmware Version</Text>
                  <Text style={styles.statusValue}>{mockMachineDetails.firmwareVersion}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Compartments Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Compartments</Text>
            <View style={styles.compartmentsGrid}>
              {mockMachineDetails.compartments.map((compartment, index) => (
                <View 
                  key={compartment.id}
                  style={[styles.compartmentCard, getCompartmentStyle(compartment.status)]}
                >
                  <View style={styles.compartmentNumber}>
                    <Text style={styles.compartmentNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.compartmentName, getCompartmentTextStyle(compartment.status)]}>
                    {compartment.name}
                  </Text>
                  <Text style={[styles.compartmentPills, getCompartmentTextStyle(compartment.status)]}>
                    {compartment.status === 'empty' 
                      ? '0 pills left' 
                      : compartment.status === 'full'
                      ? 'Full'
                      : `${compartment.pillsLeft} pills left`
                    }
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('dashboard')}
            activeOpacity={0.8}
          >
            <Ionicons name="grid-outline" size={24} color="#6b7280" />
            <Text style={styles.navText}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('prescriptions')}
            activeOpacity={0.8}
          >
            <Ionicons name="document-outline" size={24} color="#6b7280" />
            <Text style={styles.navText}>Prescriptions</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => {}}
            activeOpacity={0.8}
          >
            <View style={styles.activeNavIndicator}>
              <Ionicons name="add" size={24} color="#007AFF" />
            </View>
            <Text style={[styles.navText, styles.navTextActive]}>Machines</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('notifications')}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={24} color="#6b7280" />
            <Text style={styles.navText}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('profile')}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={24} color="#6b7280" />
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
    backgroundColor: '#F8F9FA',
  },
  wrapper: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffffcc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
    paddingRight: 32,
  },
  spacer: {
    width: 32,
  },
  main: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  statusItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  compartmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  compartmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    width: '47%',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  compartmentFull: {
    backgroundColor: '#ffffff',
  },
  compartmentNormal: {
    backgroundColor: '#ffffff',
  },
  compartmentLow: {
    backgroundColor: '#fef3c7',
  },
  compartmentEmpty: {
    backgroundColor: '#f3f4f6',
  },
  compartmentNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  compartmentNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6b7280',
  },
  compartmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  compartmentPills: {
    fontSize: 14,
    color: '#6b7280',
  },
  compartmentText: {
    color: '#111827',
  },
  compartmentTextEmpty: {
    color: '#9ca3af',
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#ffffffcc',
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
  activeNavIndicator: {
    backgroundColor: '#EBF5FF',
    borderRadius: 20,
    padding: 10,
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  navTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
});