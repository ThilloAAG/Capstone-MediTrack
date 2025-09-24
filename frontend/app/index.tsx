import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function WelcomeScreen() {
  const handleGetStarted = () => {
    router.push('/onboarding/features');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Main Content */}
      <View style={styles.main}>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDImCdeG557LDy3ws2cDYVVY6-4jonVIn3Sj_EYnjTJes1JzC7SDOpw6ra_HU6kIbPfm-N78i0ZiQByhlY2elb2l5M2KrWBbO8oOe-2aD9FFxSuVFv-RMa7gdHWGH3AtTm24eXL_KD4Bz9K7hCHLFerRx5qXEpQ0p7PFXEI1YnS7MWvrd4mwHcPT38Ctia-Kfy347WWU5HEo0AbU4rzkIqcZ9P9rmQ5uKnq6aa3DbjdYAzkmEEnUQ9oiVMZcmeslAcMuNKeO3bJmwg" }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        {/* Title and Description */}
        <View style={styles.content}>
          <Text style={styles.title}>Meditrack</Text>
          <Text style={styles.subtitle}>
            Your personal health companion.
          </Text>
        </View>
      </View>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.getStartedButton}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.getStartedButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7f8',
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 64,
  },
  imageContainer: {
    width: '100%',
    maxWidth: 320,
    aspectRatio: 3/4,
    marginTop: 32,
    marginBottom: 48,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  content: {
    alignItems: 'center',
    marginTop: 48,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
    maxWidth: 280,
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 24,
  },
  getStartedButton: {
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
  getStartedButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});