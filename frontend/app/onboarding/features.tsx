import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function FeaturesScreen() {
  const handleBack = () => {
    router.back();
  };

  const handleGetStarted = () => {
    router.push('/onboarding/device-connection');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Progress Indicator */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, styles.progressDotInactive]} />
          <View style={[styles.progressDot, styles.progressDotInactive]} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.main}>
        <View style={styles.content}>
          <Text style={styles.title}>Take control of your health</Text>
          
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="notifications" size={32} color="#13a4ec" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Personalized Reminders</Text>
                <Text style={styles.featureDescription}>
                  Receive timely alerts for your medication schedule.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="hardware-chip" size={32} color="#13a4ec" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Smart Dispensing</Text>
                <Text style={styles.featureDescription}>
                  Ensure accurate dosage with our smart dispenser.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.getStartedButtonText}>Get Started</Text>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  progressDot: {
    height: 8,
    width: 40,
    borderRadius: 4,
  },
  progressDotActive: {
    backgroundColor: '#13a4ec',
  },
  progressDotInactive: {
    backgroundColor: '#d1d5db',
  },
  main: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 48,
  },
  featuresContainer: {
    gap: 24,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 24,
    backgroundColor: '#13a4ec20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  backButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  getStartedButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#13a4ec',
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
  getStartedButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});