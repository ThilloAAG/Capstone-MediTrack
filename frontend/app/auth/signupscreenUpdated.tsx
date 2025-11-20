// src/screens/SignupForm.tsx (translated to English)

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { registerUser } from '../../src/services/auth';

export default function SignupForm() {
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const validate = (): boolean => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('All fields are required.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim().toLowerCase())) {
      setError('Invalid email address.');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    setLoading(true);
    setError('');
    try {
      const name = `${firstName.trim()} ${lastName.trim()}`.trim();
      const user = await registerUser({ email: email.trim(), password, name, role });
      console.log('Account successfully created ✅', user);
      router.replace('/onboarding/welcome');
    } catch (e: any) {
      console.log('Error ⚠️', e?.message);
      Alert.alert('Signup Error', e?.message || 'Unknown error');
      setError(e?.message || 'Unknown error');
      setPassword('');
      setConfirmPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create an Account</Text>

          {/* First Name */}
          <View style={styles.field}>
            <Text style={styles.label}>
              First Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              placeholder="Your first name"
              placeholderTextColor="#64748B"
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          {/* Last Name */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Last Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              placeholder="Your last name"
              placeholderTextColor="#64748B"
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Email <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              placeholder="ex: user@mail.com"
              placeholderTextColor="#64748B"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Password <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              placeholder="At least 6 characters"
              placeholderTextColor="#64748B"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              returnKeyType="next"
            />
          </View>

          {/* Confirm Password */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Confirm Password <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              placeholder="Re-enter your password"
              placeholderTextColor="#64748B"
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textContentType="password"
              returnKeyType="done"
            />
          </View>

          {/* Role Selection */}
          <View style={styles.roleSelector}>
            <TouchableOpacity
              onPress={() => setRole('patient')}
              style={[styles.roleButton, role === 'patient' && styles.activeRole]}
            >
              <Text style={[styles.roleText, role === 'patient' && styles.activeRoleText]}>Patient</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setRole('doctor')}
              style={[styles.roleButton, role === 'doctor' && styles.activeRole]}
            >
              <Text style={[styles.roleText, role === 'doctor' && styles.activeRoleText]}>Doctor</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Loading...' : 'Create Account'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/')} style={styles.back}>
            <Text style={styles.backText}>← Back to login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7F8' },
  keyboardContainer: { flex: 1 },
  inner: { padding: 24, paddingBottom: 36 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: '#0f172a',
  },
  field: { marginBottom: 14 },
  label: { fontWeight: '600', marginBottom: 6, color: '#0f172a' },
  required: { color: 'red' },
  input: {
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#E2E8F0',
    color: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  roleSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  roleButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#13a4ec',
    backgroundColor: 'transparent',
  },
  activeRole: { backgroundColor: '#13a4ec' },
  roleText: { color: '#13a4ec', fontWeight: '700' },
  activeRoleText: { color: '#fff' },
  errorText: { color: 'red', marginTop: 8, textAlign: 'center' },
  button: {
    backgroundColor: '#13a4ec',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  back: { marginTop: 16, alignItems: 'center' },
  backText: { color: '#475569' },
});
