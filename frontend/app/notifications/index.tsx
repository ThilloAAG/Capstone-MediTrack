import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../src/firebase'; 
import { addDays, addHours, differenceInDays } from 'date-fns';

// ✅ Keep your original notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, 
    shouldShowList: true,   
  }),
});

export default function NotificationsScreen() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReminders();
  }, []);

  // ✅ Load prescriptions from Firestore using correct path
  const loadReminders = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        setLoading(false);
        return;
      }

      // ✅ Correct path: prescriptions/{uid}/userPrescriptions
      const querySnapshot = await getDocs(collection(db, `prescriptions/${user.uid}/userPrescriptions`));
      const prescriptions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setReminders(prescriptions);
      setLoading(false);

      // Schedule notifications for each prescription
      for (const p of prescriptions) {
        await scheduleMedicationNotifications(p);
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
      Alert.alert('Error', 'Failed to load reminders from database');
      setLoading(false);
    }
  };

  // ✅ Updated to use `medicationName` instead of `medication`
  const scheduleMedicationNotifications = async (prescription: any) => {
    const { medicationName, frequency, startDate, endDate } = prescription;

    if (!medicationName || !frequency || !startDate) return;

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : addDays(start, 7); // fallback to 7 days
    const totalDays = differenceInDays(end, start) + 1;

    let timesPerDay = 1;
    if (frequency.includes('2')) timesPerDay = 2;
    if (frequency.includes('3')) timesPerDay = 3;
    if (frequency.includes('4')) timesPerDay = 4;

    for (let i = 0; i < totalDays; i++) {
      for (let j = 0; j < timesPerDay; j++) {
        const reminderTime = addHours(addDays(start, i), (j * 24) / timesPerDay);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Medication Reminder 💊',
            body: `Time to take your ${medicationName}`,
            sound: 'default',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE, 
            date: reminderTime,
          },
        });
      }
    }

    console.log(`Scheduled ${totalDays * timesPerDay} reminders for ${medicationName}`);
  };

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
            {loading ? (
              <ActivityIndicator size="large" color="#13a4ec" />
            ) : reminders.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#6b7280' }}>
                No reminders found.
              </Text>
            ) : (
              <View style={styles.remindersList}>
                {reminders.map((r) => (
                  <View key={r.id} style={styles.reminderItem}>
                    <View style={styles.reminderIconContainer}>
                      <Ionicons name="medical" size={28} color="#13a4ec" />
                    </View>
                    <View style={styles.reminderContent}>
                      <Text style={styles.reminderMedication}>
                        Take {r.medicationName || 'Medication'}
                      </Text>
                      <Text style={styles.reminderTime}>
                        {r.frequency ? `Every ${r.frequency}` : 'No frequency set'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <View style={styles.settingsList}>
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => Alert.alert('Notification preferences')}
                activeOpacity={0.8}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="notifications-outline" size={24} color="#13a4ec" />
                  </View>
                  <Text style={styles.settingTitle}>Notification Preferences</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => Alert.alert('Emergency contact')}
                activeOpacity={0.8}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="call-outline" size={24} color="#13a4ec" />
                  </View>
                  <Text style={styles.settingTitle}>Emergency Contact</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
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

          <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
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

// ✅ Same styles (unchanged)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f8' },
  wrapper: { flex: 1 },
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
  spacer: { width: 40 },
  main: { flex: 1, paddingHorizontal: 16, paddingTop: 24 },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  remindersList: { gap: 8 },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
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
  reminderContent: { flex: 1 },
  reminderMedication: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  reminderTime: { fontSize: 14, color: '#6b7280' },
  settingsList: { gap: 8 },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: '#13a4ec10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: { fontSize: 16, fontWeight: '500', color: '#111827', flex: 1 },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#f6f7f8cc',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 8,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8 },
  navText: { fontSize: 12, fontWeight: '500', color: '#9ca3af' },
  navTextActive: { color: '#13a4ec', fontWeight: '700' },
});
