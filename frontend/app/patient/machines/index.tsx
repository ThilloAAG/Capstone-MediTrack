import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const mockMachines = [
  {
    id: '1',
    name: 'Pill Dispenser',
    location: 'Living Room',
    status: 'Connected',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSQbWAQ3KSSCzWYShdEHPJ0bcufQ35ESpQ6rWBnP6v_cWdQOGMLrCG6eR-2P1U8Mu0jbZpE5R4WmyP5g43NbonsuiXG8zMu8I38PdVtSm9fGwy2H5p_F1OBiCWpk6jLPwhVFCXhmsXpN7YaXB6x4ZOSazzi4BNns4rpR0H-xjSIDYXJMbyHzQMeJhx4UZcIkmmw_OF_TDSwJ4ZXA-WcY4QD31vJV4SFne31A7otjVsbNMfL54vJj19GYyuQA6Voa3W_M7gvGqhmhY',
  },
  {
    id: '2',
    name: 'Pill Dispenser',
    location: 'Bedroom',
    status: 'Connected',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqdPCitA5aeRo2Si5C87sEPEMcUGR8L42kF8bTUl8K2t8fMYCC_ZDRV0lT_inE895fT21bUgOOrYyTyYG8qqqJ6zMf0V9U_bVAhdz-pbA7ZoXvwBqp1Bf7xxrEzlnXVdzI-mVOF1CP6s71xI-YRRlO6wbpBb-r8OTzeIIAXmsD6YEdJelHQVqfaUnx9wzsx7UFOO5qTBMdE4H6RQOZKhKgbNjFb1iQl05m0BwZWqnfDVbuFTDxsUYbrQUh17Aobl3brHodLoy9vyQ',
  },
];

export default function MachinesScreen() {
  const handleBack = () => {
    router.back();
  };

  const handleAddMachine = () => {
    console.log('Add machine pressed');
  };

  const handleMachinePress = (machineId: string) => {
    router.push(`/patient/machines/${machineId}`);
  };

  const handleNavigateToTab = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        router.push('/patient/dashboard');
        break;
      case 'prescriptions':
        router.push('/patient/prescriptions');
        break;
      case 'notifications':
        router.push('/patient/notifications');
        break;
      case 'profile':
        router.push('/patient/profile');
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
            <Ionicons name="arrow-back" size={24} color="#111618" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Machines</Text>
          <View style={styles.spacer} />
        </View>

        {/* Main Content */}
        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          <View style={styles.machinesList}>
            {mockMachines.map((machine) => (
              <TouchableOpacity 
                key={machine.id}
                style={styles.machineItem}
                onPress={() => handleMachinePress(machine.id)}
                activeOpacity={0.8}
              >
                <View style={styles.machineInfo}>
                  <Text style={styles.machineStatus}>{machine.status}</Text>
                  <Text style={styles.machineName}>{machine.name}</Text>
                  <Text style={styles.machineLocation}>{machine.location}</Text>
                </View>
                <View style={styles.machineImageContainer}>
                  <Image
                    source={{ uri: machine.image }}
                    style={styles.machineImage}
                    resizeMode="cover"
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Add Machine Button */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddMachine}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color="#ffffff" />
            <Text style={styles.addButtonText}>Add Machine</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('dashboard')}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={24} color="#617c89" />
            <Text style={styles.navText}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('prescriptions')}
            activeOpacity={0.8}
          >
            <Ionicons name="medical-outline" size={24} color="#617c89" />
            <Text style={styles.navText}>Prescriptions</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => {}}
            activeOpacity={0.8}
          >
            <View style={styles.activeNavIndicator}>
              <Ionicons name="hardware-chip" size={24} color="#13a4ec" />
            </View>
            <Text style={[styles.navText, styles.navTextActive]}>Machines</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('notifications')}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={24} color="#617c89" />
            <Text style={styles.navText}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('profile')}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={24} color="#617c89" />
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
    borderBottomColor: '#f0f3f4',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111618',
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
  machinesList: {
    gap: 16,
  },
  machineItem: {
    backgroundColor: '#13a4ec10',
    padding: 16,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  machineInfo: {
    flex: 1,
    gap: 4,
  },
  machineStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: '#617c89',
  },
  machineName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111618',
  },
  machineLocation: {
    fontSize: 14,
    color: '#617c89',
  },
  machineImageContainer: {
    width: 96,
    height: 96,
    borderRadius: 16,
    overflow: 'hidden',
  },
  machineImage: {
    width: '100%',
    height: '100%',
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#13a4ec',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 28,
    shadowColor: '#13a4ec',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#f6f7f8cc',
    borderTopWidth: 1,
    borderTopColor: '#f0f3f4',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  activeNavIndicator: {
    backgroundColor: '#13a4ec20',
    borderRadius: 20,
    padding: 8,
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#617c89',
  },
  navTextActive: {
    color: '#13a4ec',
    fontWeight: '700',
  },
});