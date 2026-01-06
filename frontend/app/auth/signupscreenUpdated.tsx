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

export default function SignupScreenUpdated() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setError('All fields are required.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
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
      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      await registerUser({
        email: email.trim(),
        password,
        name: fullName,
        role, // 🔥 patient ou doctor
      });

      Alert.alert(
        'Account created',
        `Your ${role} account has been created successfully`
      );

      router.replace('/auth/login');
    } catch (e: any) {
      Alert.alert('Signup Error', e?.message || 'Unknown error');
      setError(e?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Create Account</Text>

          {/* First Name */}
          <TextInput
            style={styles.input}
            placeholder="First name"
            placeholderTextColor="#64748B"
            value={firstName}
            onChangeText={setFirstName}
          />

          {/* Last Name */}
          <TextInput
            style={styles.input}
            placeholder="Last name"
            placeholderTextColor="#64748B"
            value={lastName}
            onChangeText={setLastName}
          />

          {/* Email */}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#64748B"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* Password */}
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#64748B"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Confirm Password */}
          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            placeholderTextColor="#64748B"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {/* Role Selector */}
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === 'patient' && styles.roleActive,
              ]}
              onPress={() => setRole('patient')}
            >
              <Text
                style={[
                  styles.roleText,
                  role === 'patient' && styles.roleTextActive,
                ]}
              >
                Patient
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                role === 'doctor' && styles.roleActive,
              ]}
              onPress={() => setRole('doctor')}
            >
              <Text
                style={[
                  styles.roleText,
                  role === 'doctor' && styles.roleTextActive,
                ]}
              >
                Doctor
              </Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.button}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/auth/login')}>
            <Text style={styles.backText}>← Back to login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F8',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#0F172A',
  },
  input: {
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    color: '#0F172A',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 12,
  },
  roleButton: {
    borderWidth: 2,
    borderColor: '#13a4ec',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  roleActive: {
    backgroundColor: '#13a4ec',
  },
  roleText: {
    color: '#13a4ec',
    fontWeight: '700',
  },
  roleTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#13a4ec',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  backText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#475569',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 8,
  },
});