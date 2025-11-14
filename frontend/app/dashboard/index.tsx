import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, FlatList } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { subscribeToPrescriptions } from '../../services/prescriptionsService';
import { generateUpcomingDoses } from '../../services/upcomingDosesService';
import { differenceInHours, differenceInMinutes, isToday } from 'date-fns';

interface Prescription {
  id: string;
  name: string;
  medication: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  taken?: boolean;
}

interface UpcomingDose {
  id: string;
  prescriptionId: string;
  medication: string;
  dosage: string;
  frequency: string;
  scheduledTime: Date;
  scheduledTimeString: string;
  timeUntilDose: string;
  status: 'upcoming' | 'overdue' | 'taken';
}

export default function DashboardScreen() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [upcomingDoses, setUpcomingDoses] = useState<UpcomingDose[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [adherenceStats, setAdherenceStats] = useState<{ taken: number; total: number }>({ taken: 0, total: 0 });

  // ✅ All handlers first
  const handleSettings = (): void => {
    router.push('/profile');
  };

  const handleDispenseNow = (): void => {
    console.log('Dispense now pressed');
  };

  const handleEmergency = (): void => {
    console.log('Emergency pressed');
  };

  const handleNavigateToTab = (tab: string): void => {
    switch (tab) {
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

  // 📊 Calculate today's adherence
  const calculateAdherence = (presc: Prescription[]): void => {
    let taken = 0;
    let total = 0;
    
    presc.forEach((p) => {
      if (p.startDate && isToday(new Date(p.startDate))) {
        total++;
        if (p.taken) taken++;
      }
    });
    
    setAdherenceStats({ taken, total });
  };

  // 🔍 Get next upcoming dose
  const getNextDose = (): UpcomingDose | null => {
    return upcomingDoses.length > 0 ? upcomingDoses[0] : null;
  };

  // ⏰ Format time until next dose
  const getTimeUntilDose = (dateObj: Date): string => {
    const target = dateObj;
    const now = new Date();
    const hours: number = differenceInHours(target, now);
    const minutes: number = differenceInMinutes(target, now) % 60;

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `In ${days} day${days !== 1 ? 's' : ''}`;
    }
    if (hours > 0) return `In ${hours}h ${minutes}m`;
    if (minutes > 0) return `In ${minutes} minutes`;
    return 'Now';
  };

  // 🔄 Load real prescriptions and generate doses
  useEffect(() => {
    const unsubscribe = subscribeToPrescriptions((data: Prescription[]) => {
      setPrescriptions(data);
      calculateAdherence(data);
      
      // Generate upcoming doses from prescriptions
      const doses = generateUpcomingDoses(data);
      setUpcomingDoses(doses);
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ✅ Get next dose (after state is available)
  const nextDose = getNextDose();

  // Render upcoming dose item
  const renderDoseItem = ({ item }: { item: UpcomingDose }) => (
    <View style={styles.doseListItem}>
      <View style={styles.doseTimeIndicator}>
        <View style={[
          styles.statusDot,
          item.status === 'taken' && styles.statusDotTaken,
          item.status === 'overdue' && styles.statusDotOverdue,
        ]} />
      </View>
      
      <View style={styles.doseContent}>
        <Text style={styles.doseMedication}>{item.medication}</Text>
        <Text style={styles.doseDosage}>{item.dosage}</Text>
        <Text style={styles.doseFrequency}>{item.frequency}</Text>
      </View>

      <View style={styles.doseTimeRight}>
        <Text style={[
          styles.doseTimeText,
          item.status === 'overdue' && styles.doseTimeOverdue,
        ]}>
          {item.timeUntilDose}
        </Text>
        <Text style={styles.doseScheduledTime}>{item.scheduledTimeString}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#13a4ec" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

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
          {/* 📊 Adherence Card */}
          <View style={styles.adherenceCard}>
            <View style={styles.adherenceHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#4ade80" />
              <Text style={styles.adherenceTitle}>Today&apos;s Adherence</Text>
            </View>
            <View style={styles.adherenceStats}>
              <Text style={styles.adherenceNumber}>
                {adherenceStats.taken}/{adherenceStats.total}
              </Text>
              <Text style={styles.adherenceLabel}>Doses Taken</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${adherenceStats.total > 0 ? (adherenceStats.taken / adherenceStats.total) * 100 : 0}%` }
                ]} 
              />
            </View>
          </View>

          {/* 💊 Next Dose Card */}
          {nextDose ? (
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
                  <Text style={styles.medicationName}>{nextDose.medication}</Text>
                  <Text style={styles.medicationDosage}>{nextDose.dosage}</Text>
                  <Text style={styles.medicationTime}>{getTimeUntilDose(nextDose.scheduledTime)}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={48} color="#b0b8c1" />
              <Text style={styles.emptyText}>No upcoming doses</Text>
            </View>
          )}

          {/* 📈 Health Insights */}
          <View style={styles.healthInsightsContainer}>
            <Text style={styles.sectionTitle}>Health Insights</Text>
            <View style={styles.insightsGrid}>
              <View style={styles.insightCard}>
                <Ionicons name="medical" size={20} color="#13a4ec" />
                <Text style={styles.insightValue}>{prescriptions.length}</Text>
                <Text style={styles.insightLabel}>Active Meds</Text>
              </View>
              <View style={styles.insightCard}>
                <Ionicons name="checkmark-done" size={20} color="#4ade80" />
                <Text style={styles.insightValue}>
                  {adherenceStats.total > 0 ? Math.round((adherenceStats.taken / adherenceStats.total) * 100) : 0}%
                </Text>
                <Text style={styles.insightLabel}>Compliance</Text>
              </View>
              <View style={styles.insightCard}>
                <Ionicons name="time" size={20} color="#f59e0b" />
                <Text style={styles.insightValue}>{upcomingDoses.length}</Text>
                <Text style={styles.insightLabel}>Upcoming</Text>
              </View>
            </View>
          </View>

          {/* 📋 Upcoming Doses List */}
          <View style={styles.upcomingDosesContainer}>
            <View style={styles.upcomingHeader}>
              <Text style={styles.sectionTitle}>Next 7 Days</Text>
              <Text style={styles.doseCount}>{upcomingDoses.length} doses</Text>
            </View>
            
            {upcomingDoses.length > 0 ? (
              <FlatList
                data={upcomingDoses.slice(0, 5)}
                renderItem={renderDoseItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                style={styles.dosesList}
              />
            ) : (
              <Text style={styles.emptyDosesList}>No upcoming doses scheduled</Text>
            )}

            {upcomingDoses.length > 5 && (
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All ({upcomingDoses.length})</Text>
                <Ionicons name="arrow-forward" size={16} color="#13a4ec" />
              </TouchableOpacity>
            )}
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
  // 📊 Adherence Card Styles
  adherenceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  adherenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  adherenceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111618',
  },
  adherenceStats: {
    alignItems: 'center',
    marginBottom: 12,
  },
  adherenceNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: '#13a4ec',
  },
  adherenceLabel: {
    fontSize: 14,
    color: '#617c89',
    marginTop: 4,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#f0f3f4',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ade80',
    borderRadius: 4,
  },
  // 💊 Next Dose Card
  nextDoseCard: {
    backgroundColor: '#13a4ec20',
    borderRadius: 24,
    padding: 16,
    marginVertical: 12,
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
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginVertical: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#b0b8c1',
    marginTop: 12,
  },
  // 📈 Health Insights
  healthInsightsContainer: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111618',
    marginBottom: 12,
  },
  insightsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  insightCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  insightValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111618',
    marginTop: 8,
  },
  insightLabel: {
    fontSize: 12,
    color: '#617c89',
    marginTop: 4,
    textAlign: 'center',
  },
  // 📋 Upcoming Doses Styles
  upcomingDosesContainer: {
    marginVertical: 16,
    marginBottom: 24,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  doseCount: {
    fontSize: 12,
    color: '#13a4ec',
    fontWeight: '600',
    backgroundColor: '#13a4ec20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dosesList: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  doseListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f3f4',
  },
  doseTimeIndicator: {
    marginRight: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#13a4ec',
  },
  statusDotTaken: {
    backgroundColor: '#4ade80',
  },
  statusDotOverdue: {
    backgroundColor: '#ef4444',
  },
  doseContent: {
    flex: 1,
    gap: 2,
  },
  doseMedication: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111618',
  },
  doseDosage: {
    fontSize: 12,
    color: '#617c89',
  },
  doseFrequency: {
    fontSize: 11,
    color: '#b0b8c1',
  },
  doseTimeRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  doseTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#13a4ec',
  },
  doseTimeOverdue: {
    color: '#ef4444',
  },
  doseScheduledTime: {
    fontSize: 10,
    color: '#b0b8c1',
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f3f4',
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    gap: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#13a4ec',
  },
  emptyDosesList: {
    textAlign: 'center',
    paddingVertical: 24,
    color: '#b0b8c1',
    fontSize: 14,
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },
  // Quick Actions
  quickActionsContainer: {
    marginVertical: 12,
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  primaryActionButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#13a4ec',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#13a4ec',
    shadowOffset: { width: 0, height: 4 },
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
  // Bottom Nav
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
