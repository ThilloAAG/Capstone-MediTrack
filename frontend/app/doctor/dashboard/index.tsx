import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

type Patient = {
  uid: string; // IMPORTANT: uid Firestore
  name: string;
  pathology?: string;
  age?: number;
  risk?: 'low' | 'medium' | 'high';
  lastUpdate?: string; // ex: "Today, 9:40"
};

export default function DoctorDashboardScreen() {
  // ✅ Mock (tu remplaceras par Firestore dès qu’on a la collection)
  const patients = useMemo<Patient[]>(
    () => [
      { uid: 'UID_PATIENT_1', name: 'Ethan Carter', pathology: 'Cardiology', age: 62, risk: 'high', lastUpdate: 'Today, 9:40' },
      { uid: 'UID_PATIENT_2', name: 'Olivia Bennett', pathology: 'Neurology', age: 45, risk: 'medium', lastUpdate: 'Yesterday, 17:05' },
      { uid: 'UID_PATIENT_3', name: 'Noah Thompson', pathology: 'Oncology', age: 78, risk: 'high', lastUpdate: 'Today, 8:10' },
      { uid: 'UID_PATIENT_4', name: 'Ava Harper', pathology: 'Pediatrics', age: 35, risk: 'low', lastUpdate: 'Mon, 13:22' },
    ],
    []
  );

  // Quick computed stats (mock)
  const totalPatients = patients.length;
  const highRiskCount = patients.filter((p) => p.risk === 'high').length;

  // Placeholder: tu pourras calculer à partir des prescriptions / logs
  const [activePrescriptions] = useState<number>(0);

  const handleSettings = () => router.push('/doctor/settings');

  const handleOpenPatients = () => router.push('/doctor/patients');

  const handleOpenPatient = (uid: string) => router.push(`/doctor/patients/${uid}`);

  const handleCreatePrescription = () => {
    Alert.alert(
      'New Prescription',
      'Placeholder. Dis-moi la page Figma et la structure Firestore docteur→patient et je te code /doctor/patients/[id]/new.'
    );
  };

  const badgeColor = (risk?: Patient['risk']) => {
    if (risk === 'high') return '#ef4444';
    if (risk === 'medium') return '#f59e0b';
    return '#22c55e';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.wrapper}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.spacer} />
          <Text style={styles.headerTitle}>Doctor Dashboard</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettings} activeOpacity={0.85}>
            <Ionicons name="settings-outline" size={22} color="#111618" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          {/* Overview Cards */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Overview</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#0A84FF18' }]}>
                <Ionicons name="people" size={18} color="#0A84FF" />
              </View>
              <Text style={styles.statValue}>{totalPatients}</Text>
              <Text style={styles.statLabel}>Patients</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#13a4ec20' }]}>
                <Ionicons name="medical" size={18} color="#13a4ec" />
              </View>
              <Text style={styles.statValue}>{activePrescriptions}</Text>
              <Text style={styles.statLabel}>Active Rx</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#ef444416' }]}>
                <Ionicons name="alert-circle" size={18} color="#ef4444" />
              </View>
              <Text style={styles.statValue}>{highRiskCount}</Text>
              <Text style={styles.statLabel}>High Risk</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.primaryAction} onPress={handleCreatePrescription} activeOpacity={0.85}>
              <Ionicons name="add-circle-outline" size={18} color="#ffffff" />
              <Text style={styles.primaryActionText}>New Prescription</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryAction} onPress={handleOpenPatients} activeOpacity={0.85}>
              <Ionicons name="people-outline" size={18} color="#0A84FF" />
              <Text style={styles.secondaryActionText}>View Patients</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Patients */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Patients</Text>
            <TouchableOpacity onPress={handleOpenPatients} activeOpacity={0.85}>
              <Text style={styles.linkText}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listCard}>
            {patients.slice(0, 4).map((p, index) => (
              <TouchableOpacity
                key={p.uid}
                style={[styles.patientRow, index !== Math.min(3, patients.length - 1) && styles.rowDivider]}
                onPress={() => handleOpenPatient(p.uid)}
                activeOpacity={0.85}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {p.name
                      .split(' ')
                      .map((x) => x[0])
                      .join('')
                      .toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.patientName}>{p.name}</Text>
                  <Text style={styles.patientMeta}>
                    {p.pathology || '—'}{p.age ? ` · ${p.age} yrs` : ''}{p.lastUpdate ? ` · ${p.lastUpdate}` : ''}
                  </Text>
                </View>

                <View style={styles.rightCol}>
                  <View style={[styles.badge, { backgroundColor: badgeColor(p.risk) + '20' }]}>
                    <Text style={[styles.badgeText, { color: badgeColor(p.risk) }]}>
                      {p.risk ? p.risk.toUpperCase() : 'OK'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9aa6b2" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 90 }} />
        </ScrollView>

        {/* Bottom Nav (Doctor) */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85}>
            <Ionicons name="grid" size={24} color="#0A84FF" />
            <Text style={[styles.navText, styles.navTextActive]}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/doctor/patients')} activeOpacity={0.85}>
            <Ionicons name="people-outline" size={24} color="#6b7280" />
            <Text style={styles.navText}>Patients</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/doctor/settings')} activeOpacity={0.85}>
            <Ionicons name="settings-outline" size={24} color="#6b7280" />
            <Text style={styles.navText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f8' },
  wrapper: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f6f7f8cc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  spacer: { width: 44 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111618',
    flex: 1,
    textAlign: 'center',
    paddingRight: 44,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  main: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  sectionHeader: { marginTop: 4, marginBottom: 10 },
  sectionHeaderRow: {
    marginTop: 6,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111618' },
  linkText: { fontSize: 13, fontWeight: '800', color: '#0A84FF' },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: { fontSize: 22, fontWeight: '900', color: '#111618' },
  statLabel: { fontSize: 12, fontWeight: '700', color: '#6b7280', marginTop: 2 },

  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  primaryAction: {
    flex: 1,
    height: 48,
    borderRadius: 22,
    backgroundColor: '#0A84FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  primaryActionText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  secondaryAction: {
    flex: 1,
    height: 48,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryActionText: { color: '#0A84FF', fontSize: 14, fontWeight: '900' },

  listCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f2f3f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontWeight: '900', color: '#617c89' },
  patientName: { fontSize: 15, fontWeight: '900', color: '#111618' },
  patientMeta: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginTop: 2 },

  rightCol: { alignItems: 'flex-end', gap: 8 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontWeight: '900' },

  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#ffffffcc',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    paddingBottom: 8,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8 },
  navText: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  navTextActive: { color: '#0A84FF' },
});
