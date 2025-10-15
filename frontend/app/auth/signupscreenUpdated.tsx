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
import { registerUser } from '../../src/services/auth'; // <-- adapte le chemin

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
      setError('Tous les champs sont requis.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim().toLowerCase())) {
      setError("L'adresse email est invalide.");
      return false;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
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
      console.log('Création réussie ✅', user);
      router.replace('/onboarding/welcome');
    } catch (e: any) {
      console.log('Erreur ⚠️', e?.message);
      Alert.alert("Erreur d'inscription", e?.message || 'Erreur inconnue');
      setError(e?.message || 'Erreur inconnue');
      // Optionnel: reset de certains champs
      setPassword(''); setConfirmPassword('');
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
          <Text style={styles.title}>Créer un compte</Text>

          {/* Prénom */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Prénom <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              placeholder="Votre prénom"
              placeholderTextColor="#64748B"
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          {/* Nom */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Nom <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              placeholder="Votre nom"
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

          {/* Mot de passe */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Mot de passe <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              placeholder="Au moins 6 caractères"
              placeholderTextColor="#64748B"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              returnKeyType="next"
            />
          </View>

          {/* Confirmation */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Confirmer le mot de passe <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              placeholder="Retapez votre mot de passe"
              placeholderTextColor="#64748B"
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textContentType="password"
              returnKeyType="done"
            />
          </View>

          {/* Choix du rôle */}
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
            <Text style={styles.buttonText}>{loading ? 'Chargement...' : 'Créer un compte'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/')} style={styles.back}>
            <Text style={styles.backText}>← Retour à la connexion</Text>
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
    backgroundColor: '#E2E8F0', // slate-200
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
  activeRole: {
    backgroundColor: '#13a4ec',
  },
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
