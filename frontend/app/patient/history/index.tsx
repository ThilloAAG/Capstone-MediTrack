import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const mockHistoryData = {
  today: [
    {
      id: '1',
      time: '10:00 AM',
      medication: 'Paracetamol',
      dosage: '10mg',
      machine: 'Machine 1',
      status: 'Taken',
    },
    {
      id: '2', 
      time: '2:00 PM',
      medication: 'Ibuprofen',
      dosage: '200mg',
      machine: 'Machine 2',
      status: 'Taken',
    },
    {
      id: '3',
      time: '10:00 PM',
      medication: 'Paracetamol',
      dosage: '10mg',
      machine: 'Machine 1',
      status: 'Taken',
    },
  ],
  yesterday: [
    {
      id: '4',
      time: '10:00 AM',
      medication: 'Paracetamol',
      dosage: '10mg',
      machine: 'Machine 1',
      status: 'Taken',
    },
    {
      id: '5',
      time: '10:00 PM', 
      medication: 'Paracetamol',
      dosage: '10mg',
      machine: 'Machine 1',
      status: 'Taken',
    },
  ],
};

export default function HistoryScreen() {
  const handleBack = () => {
    router.back();
  };

  const handleNavigateToTab = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        router.push('/dashboard');
        break;
      case 'prescriptions':
        router.push('/prescriptions');
        break;
      case 'machines':
        router.push('/machines');
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

  const renderHistoryItem = (item: any, isLast: boolean) => (
    <View key={item.id} style={styles.timelineItem}>
      <View style={styles.timelineIconContainer}>
        <Ionicons name="medical" size={16} color="#ffffff" />
      </View>
      <View style={styles.timelineContent}>
        <Text style={styles.timelineTitle}>
          {item.time} - {item.medication}, {item.dosage}
        </Text>
        <Text style={styles.timelineSubtitle}>
          {item.machine} - {item.status}
        </Text>
      </View>
      {!isLast && <View style={styles.timelineLine} />}
    </View>
  );

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
            <Ionicons name="arrow-back-ios" size={24} color="#111618" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Logs</Text>
          <View style={styles.spacer} />
        </View>

        {/* Main Content */}
        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          {/* Today Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today</Text>
            <View style={styles.timeline}>
              {mockHistoryData.today.map((item, index) => 
                renderHistoryItem(item, index === mockHistoryData.today.length - 1)
              )}
            </View>
          </View>

          {/* Yesterday Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yesterday</Text>
            <View style={styles.timeline}>
              {mockHistoryData.yesterday.map((item, index) => 
                renderHistoryItem(item, index === mockHistoryData.yesterday.length - 1)
              )}
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
            <Ionicons name="home-outline" size={24} color="#6b7280" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('prescriptions')}
            activeOpacity={0.8}
          >
            <Ionicons name="medical-outline" size={24} color="#6b7280" />
            <Text style={styles.navText}>Medications</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => {}}
            activeOpacity={0.8}
          >
            <Ionicons name="time" size={24} color="#13a4ec" />
            <Text style={[styles.navText, styles.navTextActive]}>Logs</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('machines')}
            activeOpacity={0.8}
          >
            <Ionicons name="hardware-chip-outline" size={24} color="#6b7280" />
            <Text style={styles.navText}>Machines</Text>
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
    backgroundColor: '#f6f7f8',
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
    backgroundColor: '#f6f7f8cc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111618',
    flex: 1,
    textAlign: 'center',
    paddingRight: 40,
  },
  spacer: {
    width: 40,
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
    color: '#111618',
    marginBottom: 16,
  },
  timeline: {
    position: 'relative',
    paddingLeft: 32,
  },
  timelineItem: {
    position: 'relative',
    marginBottom: 24,
  },
  timelineIconContainer: {
    position: 'absolute',
    left: -18,
    top: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#13a4ec',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineContent: {
    paddingLeft: 16,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111618',
    marginBottom: 4,
    lineHeight: 22,
  },
  timelineSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  timelineLine: {
    position: 'absolute',
    left: -8,
    top: 26,
    bottom: -24,
    width: 2,
    backgroundColor: '#e5e7eb',
    zIndex: 1,
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#f6f7f8cc',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 16,
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  navTextActive: {
    color: '#13a4ec',
    fontWeight: '700',
  },
});