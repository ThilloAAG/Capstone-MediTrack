import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const mockPrescription = {
  id: '1',
  name: 'Lisinopril',
  dosage: '20mg',
  amount: '1 tablet',
  frequency: 'Once daily',
  time: '8:00 AM',
  refillsLeft: 3,
  notes: 'Take with water. Avoid grapefruit juice.',
  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDG93ImM15k-_eRgP2JV_zt-XVOpNx-n-3exriZj3ku9zgqzKU4O5VizU4WITiFUsdEaCUWhijEgyZEUf9Hy-048vWR-L7yarUt6zWADxbWibXwdSewHY8Uxlkw7jM36RHcuEOahUOpeUaVmX-EK3M7IORyIZS0Q-DlQlPOGUqVnf9Us0MK4FUOMAMZqlqK1EeuGiPdMYfOjFubj0dUgnQ0NVNwB69jUJDd_35-R4C2gPc0FqQ4gGx20BSZz47RfFrQbnaVMmi4e-E',
};

export default function PrescriptionDetailScreen() {
  const { id } = useLocalSearchParams();

  const handleBack = () => {
    router.back();
  };

  const handleMarkAsTaken = () => {
    Alert.alert(
      'Mark as Taken',
      'Are you sure you want to mark this medication as taken?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark as Taken', onPress: () => console.log('Marked as taken') }
      ]
    );
  };

  const handleEdit = () => {
    console.log('Edit prescription');
    Alert.alert('Edit Prescription', 'Edit functionality would open here');
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Prescription',
      'Are you sure you want to delete this prescription? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            console.log('Prescription deleted');
            router.back();
          }
        }
      ]
    );
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
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prescription Details</Text>
          <View style={styles.spacer} />
        </View>

        {/* Main Content */}
        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          {/* Medication Header */}
          <View style={styles.medicationHeader}>
            <View style={styles.medicationImageContainer}>
              <Image
                source={{ uri: mockPrescription.image }}
                style={styles.medicationImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.medicationInfo}>
              <Text style={styles.medicationName}>{mockPrescription.name}</Text>
              <Text style={styles.medicationDosage}>{mockPrescription.dosage}</Text>
            </View>
          </View>

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Dosage</Text>
              <Text style={styles.detailValue}>{mockPrescription.amount}</Text>
            </View>
            
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Frequency</Text>
              <Text style={styles.detailValue}>{mockPrescription.frequency}</Text>
            </View>
            
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{mockPrescription.time}</Text>
            </View>
            
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Refills Left</Text>
              <Text style={styles.detailValue}>{mockPrescription.refillsLeft}</Text>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.notesCard}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesValue}>{mockPrescription.notes}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.primaryActionButton}
              onPress={handleMarkAsTaken}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryActionText}>Mark as Taken</Text>
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={handleEdit}
                activeOpacity={0.8}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={handleDelete}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
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
            <Ionicons name="grid-outline" size={24} color="#64748b" />
            <Text style={styles.navText}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigateToTab('prescriptions')}
            activeOpacity={0.8}
          >
            <Ionicons name="medical" size={24} color="#13a4ec" />
            <Text style={[styles.navText, styles.navTextActive]}>Prescriptions</Text>
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
            <Ionicons name="person-outline" size={24} color="#64748b" />
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
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
    paddingTop: 24,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  medicationImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 24,
    overflow: 'hidden',
  },
  medicationImage: {
    width: '100%',
    height: '100%',
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 16,
    color: '#64748b',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  detailCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 24,
    width: '47%',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  notesCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 4,
  },
  notesValue: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 32,
  },
  primaryActionButton: {
    backgroundColor: '#13a4ec',
    height: 48,
    borderRadius: 24,
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
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#13a4ec20',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#13a4ec',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#ef444410',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '700',
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