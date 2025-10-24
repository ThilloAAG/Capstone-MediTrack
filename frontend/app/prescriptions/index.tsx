import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import {
  addPrescription,
  updatePrescription,
  deletePrescription,
  subscribeToPrescriptions,
} from '../../services/prescriptionsService';
import { auth } from '../../src/firebase';

export default function PrescriptionsScreen() {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = subscribeToPrescriptions(userId, setPrescriptions);
    return () => unsubscribe();
  }, [userId]);

  const handleAddPrescription = async () => {
    if (!userId) return;
    const newPrescription = { name: 'New Medicine', dosage: '10mg', nextDoseAt: '08:00' };
    await addPrescription(userId, newPrescription);
    Alert.alert('Added!', 'Prescription successfully added.');
  };

  const handleEditPrescription = async (id: string) => {
    if (!userId) return;
    const updatedData = { name: 'Updated Name' }; // plus tard: remplacer par formulaire
    await updatePrescription(userId, id, updatedData);
    Alert.alert('Updated!', 'Prescription successfully edited.');
  };

  const handleDeletePrescription = (id: string) => {
    if (!userId) return;
    Alert.alert('Delete Prescription', 'Are you sure you want to delete this prescription?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => { await deletePrescription(userId, id); },
      },
    ]);
  };

  const handleNavigateToTab = (tab: string) => {
    switch (tab) {
      case 'dashboard': router.push('/dashboard'); break;
      case 'machines': router.push('/machines'); break;
      case 'notifications': router.push('/notifications'); break;
      case 'profile': router.push('/profile'); break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.wrapper}>
        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Prescriptions</Text>
          </View>

          <View style={styles.prescriptionsContainer}>
            <View style={styles.prescriptionsList}>
              {prescriptions.map((prescription, index) => (
                <View
                  key={prescription.id}
                  style={[
                    styles.prescriptionItem,
                    index !== prescriptions.length - 1 && styles.prescriptionItemBorder,
                  ]}
                >
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => router.push(`/prescriptions/${prescription.id}`)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.prescriptionInfo}>
                      <Text style={styles.prescriptionName}>{prescription.name}</Text>
                      <Text style={styles.prescriptionDosage}>{prescription.dosage}</Text>
                    </View>
                    <View style={styles.prescriptionTiming}>
                      <Text style={styles.nextIntakeLabel}>Next intake</Text>
                      <Text style={styles.nextIntakeTime}>{prescription.nextDoseAt}</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={() => handleEditPrescription(prescription.id)}>
                      <Ionicons name="create-outline" size={22} color="#0A84FF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeletePrescription(prescription.id)} style={{ marginLeft: 12 }}>
                      <Ionicons name="trash-outline" size={22} color="red" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.addButton} onPress={handleAddPrescription}>
          <Ionicons name="add" size={32} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.bottomNavigation}>
          <TouchableOpacity style={styles.navItem} onPress={() => handleNavigateToTab('dashboard')}>
            <Ionicons name="home" size={24} color="#6b7280" />
            <Text style={styles.navText}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="medical" size={24} color="#0A84FF" />
            <Text style={[styles.navText, styles.navTextActive]}>Prescriptions</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => handleNavigateToTab('machines')}>
            <Ionicons name="hardware-chip" size={24} color="#6b7280" />
            <Text style={styles.navText}>Machines</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => handleNavigateToTab('notifications')}>
            <Ionicons name="notifications" size={24} color="#6b7280" />
            <Text style={styles.navText}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => handleNavigateToTab('profile')}>
            <Ionicons name="person" size={24} color="#6b7280" />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa' },
  wrapper: { flex: 1 },
  main: { flex: 1, paddingBottom: 120 },
  header: { paddingHorizontal: 24, paddingTop: 48, paddingBottom: 16, backgroundColor: '#f7f8fa80' },
  headerTitle: { fontSize: 32, fontWeight: '700', color: '#000' },
  prescriptionsContainer: { paddingHorizontal: 16 },
  prescriptionsList: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden' },
  prescriptionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  prescriptionItemBorder: { borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  prescriptionInfo: { flex: 1 },
  prescriptionName: { fontSize: 18, fontWeight: '600', color: '#000' },
  prescriptionDosage: { fontSize: 16, color: '#6b7280' },
  prescriptionTiming: { alignItems: 'flex-end' },
  nextIntakeLabel: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  nextIntakeTime: { fontSize: 16, fontWeight: '600', color: '#000' },
  actionButtons: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  addButton: { position: 'absolute', bottom: 120, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#0A84FF', alignItems: 'center', justifyContent: 'center', shadowColor: '#0A84FF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 12 },
  bottomNavigation: { flexDirection: 'row', backgroundColor: '#ffffffb3', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8, paddingBottom: 8 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8 },
  navText: { fontSize: 12, fontWeight: '500', color: '#6b7280' },
  navTextActive: { color: '#0A84FF', fontWeight: '600' },
});