import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../src/firebase';
import { doc, onSnapshot, deleteDoc } from 'firebase/firestore';

type Prescription = {
  id: string;
  medicationName?: string;
  dosage?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  userId?: string;
};

export default function PrescriptionDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const docId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id) || '', [params.id]);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

useEffect(() => {
  // 🔹 D’abord, récupère l’utilisateur courant
  const uid = auth.currentUser?.uid;

  // 🔹 Si on n’a pas d’utilisateur ou pas d’ID de prescription, on sort
  if (!docId || !uid) {
    setLoading(false);
    return;
  }

  // 🔹 On construit la bonne référence Firestore
  const ref = doc(db, 'prescriptions', uid, 'userPrescriptions', docId);

  // 🔹 On écoute le document
  const unsub = onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      setPrescription(null);
      setIsOwner(false);
      setLoading(false);
      return;
    }

    // ✅ On récupère les données du document
    const data = { id: snap.id, ...(snap.data() as any) } as Prescription;
    setPrescription(data);

    // 🔹 On vérifie si l’utilisateur connecté est bien le propriétaire
    setIsOwner(true);
    setLoading(false);
  });

  // 🔹 Nettoyage à la fin du cycle
  return unsub;
}, [docId]);

  const handleBack = () => {
    router.back();
  };

  const handleDelete = () => {
    if (!isOwner || !docId) return;
    Alert.alert(
      'Supprimer',
      'Confirmer la suppression de cette prescription ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'prescriptions', docId));
              router.back();
            } catch (e) {
              Alert.alert('Erreur', "Impossible de supprimer la prescription.");
            }
          },
        },
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
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prescription Details</Text>
          <View style={styles.spacer} />
        </View>

        {/* Main Content */}
        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          {loading ? (
            <Text style={{ color: '#6b7280', textAlign: 'center', padding: 20 }}>Chargement…</Text>
          ) : !prescription ? (
            <Text style={{ color: '#ef4444', textAlign: 'center', padding: 20 }}>Prescription introuvable.</Text>
          ) : !isOwner ? (
            <Text style={{ color: '#ef4444', textAlign: 'center', padding: 20 }}>Accès non autorisé.</Text>
          ) : (
            <>
              {/* Medication Header */}
              <View style={styles.medicationHeader}>
                <View style={styles.medicationImageContainer}>
                  <Image
                    source={{ uri: 'https://dummyimage.com/96x96/f3f4f6/aaaaaa.png&text=Rx' }}
                    style={styles.medicationImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.medicationInfo}>
                  <Text style={styles.medicationName}>{prescription.medicationName || 'Sans nom'}</Text>
                  <Text style={styles.medicationDosage}>{prescription.dosage || '-'}</Text>
                </View>
              </View>

              {/* Details Grid */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Fréquence</Text>
                  <Text style={styles.detailValue}>{prescription.frequency || '-'}</Text>
                </View>
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Période</Text>
                  <Text style={styles.detailValue}>
                    {(prescription.startDate || '') + (prescription.endDate ? ` → ${prescription.endDate}` : '')}
                  </Text>
                </View>
              </View>

              {/* Notes */}
              {!!prescription.notes && (
                <View style={styles.notesCard}>
                  <Text style={styles.notesLabel}>Notes</Text>
                  <Text style={styles.notesValue}>{prescription.notes}</Text>
                </View>
              )}

              {/* Actions */}
              <View style={styles.actionButtons}>
                <View style={styles.secondaryActions}>
                  <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.8}>
                    <Text style={styles.deleteButtonText}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
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
