import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const handleSettings = () => {
    console.log('Settings pressed');
  };

  const handleDispenseNow = () => {
    console.log('Dispense now pressed');
  };

  const handleEmergency = () => {
    console.log('Emergency pressed');
  };

  const handleNavigateToTab = (tab: string) => {
    switch (tab) {
      case 'prescriptions':
        router.push('/prescriptions');
        break;
      case 'machines':
        router.push('/machines');
        break;
      case 'notifications':
        console.log('Navigate to notifications');
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
          <View style={styles.spacer} />
          <Text style={styles.headerTitle}>Dashboard</Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={handleSettings}
            activeOpacity={0.8}
          >
            <Ionicons name="settings-outline" size={24} color="#111618" />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          {/* Next Dose Card */}
          <View style={styles.nextDoseCard}>
            <View style={styles.cardContent}>
              <View style={styles.medicationImageContainer}>
                <Image
                  source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWS6ygCc6px20INOg_CCFWfJ1wP7pjwuVKaW7qS9EMYnIQINBtuWO18lKBIyhusx0mmuwZuHggEUAOZNFyNEG0PqUeWQ4v6262Wp1BzGNolViY501vaGS9r-6XwvfQEHtIRv7cgkPOs_OWZpmOlH555CN_XCalVyxAejbfoHplAh_XyfcwmSBX1mXvZi-8SfMO5KW2uS2zuPTt_BWyH1kGn1I0b8ZI9f4aFwhBncFObp0A5du0bxyi84MLsSEaZwkjVkY6b_CIOUk" }}
                  style={styles.medicationImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.medicationInfo}>
                <Text style={styles.nextDoseLabel}>Next Dose</Text>
                <Text style={styles.medicationName}>Ibuprofen</Text>
                <Text style={styles.medicationDosage}>2 pills</Text>
                <Text style={styles.medicationTime}>In 2 hours</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity 
                style={styles.primaryActionButton}
                onPress={handleDispenseNow}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryActionText}>Dispense Now</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryActionButton}
                onPress={handleEmergency}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryActionText}>Emergency</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => {}}
            activeOpacity={0.8}
          >
            <Ionicons name="home" size={24} color="#13a4ec" />
            <Text style={[styles.navText, styles.navTextActive]}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('prescriptions')}
            activeOpacity={0.8}
          >
            <Ionicons name="medical" size={24} color="#617c89" />
            <Text style={styles.navText}>Prescriptions</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('machines')}
            activeOpacity={0.8}
          >
            <Ionicons name="hardware-chip" size={24} color="#617c89" />
            <Text style={styles.navText}>Machines</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('notifications')}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications" size={24} color="#617c89" />
            <Text style={styles.navText}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('profile')}
            activeOpacity={0.8}
          >
            <Ionicons name="person" size={24} color="#617c89" />
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
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f3f4',
  },
  spacer: {
    width: 48,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111618',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    flex: 1,
    paddingHorizontal: 16,
  },
  nextDoseCard: {
    backgroundColor: '#13a4ec20',
    borderRadius: 24,
    padding: 16,
    marginVertical: 24,
  },
  cardContent: {
    flexDirection: 'row',
    gap: 16,
  },
  medicationImageContainer: {
    width: 120,
    height: 160,
  },
  medicationImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  medicationInfo: {
    flex: 1,
    gap: 4,
  },
  nextDoseLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111618',
  },
  medicationName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#13a4ec',
    marginTop: 8,
  },
  medicationDosage: {
    fontSize: 16,
    color: '#617c89',
  },
  medicationTime: {
    fontSize: 16,
    color: '#617c89',
  },
  quickActionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111618',
    paddingHorizontal: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
  },
  primaryActionButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#13a4ec',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#13a4ec',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f0f3f4',
  },
  secondaryActionText: {
    color: '#111618',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#ffffffcc',
    borderTopWidth: 1,
    borderTopColor: '#f0f3f4',
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
    color: '#617c89',
  },
  navTextActive: {
    color: '#13a4ec',
    fontWeight: '600',
  },
});