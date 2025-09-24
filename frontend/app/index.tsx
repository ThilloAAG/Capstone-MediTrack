import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function SplashScreen() {
  useEffect(() => {
    // Simulate app loading time
    const timer = setTimeout(() => {
      router.replace('/auth/login');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.content}>
        {/* Logo/Icon placeholder */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>M</Text>
          </View>
        </View>

        {/* App Name */}
        <Text style={styles.appName}>Meditrack</Text>
        <Text style={styles.tagline}>Your personal health companion</Text>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBar}>
            <View style={styles.loadingProgress} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13a4ec',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffffff20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff40',
  },
  logoText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
  },
  appName: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: '#ffffff80',
    textAlign: 'center',
    marginBottom: 64,
  },
  loadingContainer: {
    width: '100%',
    maxWidth: 200,
  },
  loadingBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#ffffff30',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgress: {
    width: '60%',
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
});