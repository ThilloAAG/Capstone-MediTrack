import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const mockReminders = [
  {
    id: '1',
    medication: 'Medication A',
    time: '10:00 AM',
    icon: 'medical-outline',
  },
  {
    id: '2',
    medication: 'Medication B', 
    time: '12:00 PM',
    icon: 'medical-outline',
  },
  {
    id: '3',
    medication: 'Medication C',
    time: '06:00 PM',
    icon: 'medical-outline',
  },
];

const mockSettings = [
  {
    id: '1',
    title: 'Notification Preferences',
    icon: 'notifications-outline',
    action: () => console.log('Notification preferences'),
  },
  {
    id: '2',
    title: 'Emergency Contact',
    icon: 'call-outline',
    action: () => console.log('Emergency contact'),
  },
];

export default function NotificationsScreen() {
  const handleMenuPress = () => {
    console.log('Menu pressed');
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
            style={styles.menuButton}
            onPress={handleMenuPress}
            activeOpacity={0.8}
          >
            <Ionicons name="menu-outline" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.spacer} />
        </View>

        {/* Main Content */}
        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          {/* Reminders Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reminders</Text>
            <View style={styles.remindersList}>
              {mockReminders.map((reminder) => (
                <View key={reminder.id} style={styles.reminderItem}>
                  <View style={styles.reminderIconContainer}>
                    <Ionicons name="medical" size={28} color="#13a4ec" />
                  </View>
                  <View style={styles.reminderContent}>
                    <Text style={styles.reminderMedication}>Take {reminder.medication}</Text>
                    <Text style={styles.reminderTime}>{reminder.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <View style={styles.settingsList}>
              {mockSettings.map((setting) => (
                <TouchableOpacity 
                  key={setting.id}
                  style={styles.settingItem}
                  onPress={setting.action}
                  activeOpacity={0.8}
                >
                  <View style={styles.settingLeft}>
                    <View style={styles.settingIconContainer}>
                      <Ionicons name={setting.icon as any} size={24} color="#13a4ec" />
                    </View>
                    <Text style={styles.settingTitle}>{setting.title}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
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
            <Ionicons name="home-outline" size={24} color="#9ca3af" />
            <Text style={styles.navText}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('prescriptions')}
            activeOpacity={0.8}
          >
            <Ionicons name="medical-outline" size={24} color="#9ca3af" />
            <Text style={styles.navText}>Prescriptions</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('machines')}
            activeOpacity={0.8}
          >
            <Ionicons name="grid-outline" size={24} color="#9ca3af" />
            <Text style={styles.navText}>Machines</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => {}}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications" size={24} color="#13a4ec" />
            <Text style={[styles.navText, styles.navTextActive]}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('profile')}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={24} color="#9ca3af" />
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f6f7f8cc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
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
    paddingTop: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  remindersList: {
    gap: 8,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reminderIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#13a4ec10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderContent: {
    flex: 1,
  },
  reminderMedication: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  reminderTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingsList: {
    gap: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: '#13a4ec10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#f6f7f8cc',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 8,
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
    color: '#9ca3af',
  },
  navTextActive: {
    color: '#13a4ec',
    fontWeight: '700',
  },
});