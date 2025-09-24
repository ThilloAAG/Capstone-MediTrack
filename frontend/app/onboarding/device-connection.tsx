import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function DeviceConnectionScreen() {
  const handleHelp = () => {
    // Mock help functionality
    console.log('Help pressed');
  };

  const handleConnectDevice = () => {
    router.push('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.spacer} />
        <TouchableOpacity 
          style={styles.helpButton}
          onPress={handleHelp}
          activeOpacity={0.8}
        >
          <Ionicons name="help-circle-outline" size={32} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.main}>
        <Text style={styles.title}>Connect your device</Text>
        <Text style={styles.subtitle}>
          To connect your smart pill dispenser, ensure it's powered on and within range. Follow the steps below to complete the connection.
        </Text>
        
        {/* Device Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuA3N-s_3mrqt5oWes0OmbYFFwREzdibowErrghxaOJZafuKAc_rA1mUYqd8kZ5JEnTn5-wqPEWyqQwQ8v0dH5RRCJWFhorHRJkiOrS-ajd9kyZz_guVomhiK3qclHHsRJnbg5BRnUVNvK8_jb6eVTGmm3fj2mGTnuoZPJHxWn0VtP1vmA-dlIpC161c3FUcth81kg6pHjVvzTV3XpA2TheGKCzUGVxB87YYM9uscNrbiQfLEKVPBQJ7UZuwwLxIQMPcR4qzRpNVWXU" }}
            style={styles.deviceImage}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.connectButton}
          onPress={handleConnectDevice}
          activeOpacity={0.8}
        >
          <Text style={styles.connectButtonText}>Connect My Device</Text>
        </TouchableOpacity>
        
        {/* Progress Dots */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, styles.progressDotInactive]} />
          <View style={[styles.progressDot, styles.progressDotInactive]} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  spacer: {
    width: 48,
  },
  helpButton: {
    padding: 8,
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
    marginBottom: 32,
  },
  imageContainer: {
    width: '100%',
    maxWidth: 240,
    aspectRatio: 2/3,
    marginTop: 32,
  },
  deviceImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  connectButton: {
    backgroundColor: '#13a4ec',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#13a4ec',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  progressDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
  },
  progressDotActive: {
    backgroundColor: '#111827',
  },
  progressDotInactive: {
    backgroundColor: '#d1d5db',
  },
});