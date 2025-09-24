import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const adminSections = [
  {
    title: 'User Management',
    items: [
      {
        id: 'manage-users',
        title: 'Manage Users',
        action: () => console.log('Manage Users'),
      },
    ],
  },
  {
    title: 'Machine Management',
    items: [
      {
        id: 'global-logs',
        title: 'View Global Logs',
        action: () => router.push('/history'),
      },
      {
        id: 'update-firmware',
        title: 'Update Firmware',
        action: () => handleUpdateFirmware(),
      },
      {
        id: 'reset-machine',
        title: 'Reset Machine',
        action: () => handleResetMachine(),
      },
      {
        id: 'block-machine',
        title: 'Block Machine',
        action: () => handleBlockMachine(),
        isDestructive: true,
      },
    ],
  },
];

function handleUpdateFirmware() {
  Alert.alert(
    'Update Firmware',
    'Are you sure you want to update the firmware? This process may take several minutes.',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Update', 
        onPress: () => console.log('Firmware update started')
      }
    ]
  );
}

function handleResetMachine() {
  Alert.alert(
    'Reset Machine',
    'This will reset the machine to factory settings. All data will be lost.',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Reset', 
        style: 'destructive',
        onPress: () => console.log('Machine reset initiated')
      }
    ]
  );
}

function handleBlockMachine() {
  Alert.alert(
    'Block Machine',
    'This will block the machine from connecting to the network. Are you sure?',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Block', 
        style: 'destructive',
        onPress: () => console.log('Machine blocked')
      }
    ]
  );
}

export default function AdminScreen() {
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
        router.push('/profile');
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
            <Ionicons name="chevron-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <View style={styles.spacer} />
        </View>

        {/* Main Content */}
        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionsContainer}>
            {adminSections.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.sectionContent}>
                  {section.items.map((item, index) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.adminItem,
                        index !== section.items.length - 1 && styles.adminItemBorder
                      ]}
                      onPress={item.action}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.adminTitle,
                        item.isDestructive && styles.adminTitleDestructive
                      ]}>
                        {item.title}
                      </Text>
                      <Ionicons name="chevron-forward" size={20} color="#64748b" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('dashboard')}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={24} color="#64748b" />
            <Text style={styles.navText}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('prescriptions')}
            activeOpacity={0.8}
          >
            <Ionicons name="document-outline" size={24} color="#64748b" />
            <Text style={styles.navText}>Prescriptions</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('machines')}
            activeOpacity={0.8}
          >
            <Ionicons name="hardware-chip-outline" size={24} color="#64748b" />
            <Text style={styles.navText}>Machines</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('notifications')}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={24} color="#64748b" />
            <Text style={styles.navText}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('profile')}
            activeOpacity={0.8}
          >
            <Ionicons name="person" size={24} color="#13a4ec" />
            <Text style={[styles.navText, styles.navTextActive]}>Profile</Text>
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
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
    paddingRight: 40,
  },
  spacer: {
    width: 32,
  },
  main: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionsContainer: {
    gap: 32,
    paddingBottom: 32,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  sectionContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
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
  adminItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  adminItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  adminTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    flex: 1,
  },
  adminTitleDestructive: {
    color: '#dc2626',
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
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
    color: '#64748b',
  },
  navTextActive: {
    color: '#13a4ec',
    fontWeight: '600',
  },
});